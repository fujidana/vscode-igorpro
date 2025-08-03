import * as vscode from 'vscode';
import * as lang from './language';
import { SemVer, satisfies } from 'semver';

const suppressMessagesConfig = {
    'completionItem.label.detail': false,
    'completionItem.label.description': false,
    'completionItem.documentation': false,
    'signatureHelp.signatures.documentation': false,
    'hover.contents': false
};

type SuppressMessagesConfig = Partial<typeof suppressMessagesConfig>;

function getShortDescription(item: lang.ReferenceItem, category: lang.ReferenceCategory, itemUriString: string, documentUriString: string, markdownFormat: boolean) {
    let symbolLabel: string;
    let itemUriLabel: string | undefined;

    symbolLabel = lang.referenceCategoryMetadata[category].label;

    if (itemUriString === lang.BUILTIN_URI || itemUriString === lang.OPERATION_URI || itemUriString === lang.EXTRA_URI) {
        symbolLabel = 'built-in ' + symbolLabel;
    } else if (itemUriString === lang.EXTERNAL_URI) {
        symbolLabel = 'external ' + symbolLabel;
    } else if (itemUriString === lang.ACTIVE_FILE_URI || itemUriString === documentUriString) {
        if (item.location) {
            symbolLabel = `${symbolLabel} defined at l.${item.location.start.line} in this file `;
        } else {
            symbolLabel = symbolLabel + ' defined in this file';
        }
    } else {
        itemUriLabel = vscode.workspace.asRelativePath(vscode.Uri.parse(itemUriString));
        symbolLabel = markdownFormat ? 'user-defined ' + symbolLabel : symbolLabel + ' defined in ' + itemUriLabel;
    }
    let mainText = `${item.signature} // ${item.isStatic ? 'static ' : ''}${symbolLabel}`;
    if (item.overloads && item.overloads.length > 1) {
        mainText += `, ${item.overloads.length} overloads`;
    }

    if (markdownFormat) {
        mainText = '```\n' + mainText + '\n```\n\n';
        if (itemUriLabel) {
            mainText += `_defined in_ [${itemUriLabel}](${itemUriString}).\n\n`;
        }
    }
    return mainText;
}


const enum TruncationLevel {
    full = 0,
    paragraph,
    line
}

function truncateString(level: TruncationLevel, item: { description?: string, deprecated?: lang.VersionRange, available?: lang.VersionRange }): string | undefined {
    let truncatedString;
    if (item.description) {
        if (level === TruncationLevel.full) {
            truncatedString = item.description;
        } else if (level === TruncationLevel.paragraph) {
            const endIndex = item.description.indexOf('\n\n');
            truncatedString = (endIndex >= 0) ? item.description.substring(0, endIndex) + '\n\n...' : item.description;
        } else if (level === TruncationLevel.line) {
            const endIndex = item.description.search(/\.\s/g);
            truncatedString = (endIndex >= 0) ? item.description.substring(0, endIndex) + '. ...' : item.description;
        }
    }

    if (level !== TruncationLevel.line) {
        if (item.available) {
            const tmpStr = lang.getVersionRangeDescription(item.available, 'available');
            truncatedString = truncatedString ? truncatedString + '\n\n' + tmpStr : tmpStr;
        }

        if (item.deprecated) {
            const tmpStr = lang.getVersionRangeDescription(item.deprecated, 'deprecated');
            truncatedString = truncatedString ? truncatedString + '\n\n' + tmpStr : tmpStr;
        }
    }
    return truncatedString;
}

function getParameterInformation(signature: string): vscode.ParameterInformation[] | undefined {
    const parenStart = signature.indexOf('(');
    const parenEnd = signature.lastIndexOf(')');
    if (parenStart < 0 || parenEnd < 0) {
        return undefined;
    }
    // const selectorName = signature.substring(0, parStart).trim();
    const parameters = signature.substring(parenStart + 1, parenEnd).trim().replace(/[[\]]/g, '').split(/\s*,\s*/);
    return parameters.map(parameter => new vscode.ParameterInformation(parameter));
}

function parseSignatureInEditing(line: string, position: number) {
    let substr = line.substring(0, position);

    // flatten paired parentheses:
    // from "parentfunc(sonfunc(a, b, c), daughterFunc(d, e"
    // to   "parentfunc(sonfunc_________, daughterFunc(d, e"
    for (; ;) {
        const newstr = substr.replace(/\([^()]*\)/g, substr => '_'.repeat(substr.length));
        if (newstr === substr) {
            substr = newstr;
            break;
        }
        substr = newstr;
    }

    // find an incomplete function call.
    // If the function calls are nested, get the last (i.e., the most nested) one.
    // currently I can not do in one-line regular expression.
    const regExp = /^(.*?)([a-zA-Z_][a-zA-Z0-9_]*)\(/;
    let prevMatch: RegExpMatchArray | null = null;
    let currMatch: RegExpMatchArray | null;
    while ((currMatch = substr.match(regExp)) !== null) {
        substr = substr.substring(currMatch[0].length);
        prevMatch = currMatch;
    }

    // *Specific to Igor Pro*: take care of case-insensitiveness.
    return prevMatch ? { 'signature': prevMatch[2].toLowerCase(), 'argumentIndex': substr.split(',').length - 1 } : undefined;
}

/***
 * Get an Igor Pro-style version string (like `7.38` and `9.02`) from the settings 
 * and convert it to a SemVer object.
 */
export function getIgorVersion(): SemVer {
    const igorVersionStr = vscode.workspace.getConfiguration('vscode-igorpro').get<string>('igorVersion', '9.01');
    const matches = igorVersionStr.match(/^(0|[1-9]\d*)\.(\d)(\d)(?!\d)/);
    return new SemVer(matches ? `${matches[1]}.${matches[2]}.${matches[3]}` : '0.0.0');
}

const enum WordType {
    unclassified = 0,
    firstWord,
    flag
}

function getWordTypeInCommand(document: vscode.TextDocument, position: vscode.Position): WordType {
    const preceedingText = document.getText(new vscode.Range(position.with({ character: 0 }), position));
    if (/(?<=;|^)\s*[a-zA-Z][a-zA-Z0-9_]*$/.test(preceedingText)) {
        return WordType.firstWord;
    } else if (/\/[a-zA-Z][a-zA-Z0-9_]*$/.test(preceedingText)) {
        return WordType.flag;
    }
    return WordType.unclassified;
}

/**
 * Controller class
 */
export class Controller<T extends lang.UpdateSession = lang.UpdateSession> implements vscode.CompletionItemProvider<lang.CompletionItem>, vscode.HoverProvider, vscode.SignatureHelpProvider {

    // In JavaScript, equality comparison (`==` and `===`) of two different objects
    // is always `false`, regardless of the equality of their values.
    // Therefore, the string representation of the Uri object is used in the extension.
    // String is a primitive type and thus, the equality comparision is based on the value.

    public readonly updateSessionMap: Map<string, T> = new Map();
    protected igorVersion: SemVer;

    constructor(context: vscode.ExtensionContext) {
        this.igorVersion = getIgorVersion();

        const configurationChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('vscode-igorpro.igorVersion')) {
                this.igorVersion = getIgorVersion();
            }
        };

        // Register providers and event handlers.
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(lang.SELECTOR, this),
            vscode.languages.registerHoverProvider(lang.SELECTOR, this),
            vscode.languages.registerSignatureHelpProvider(lang.SELECTOR, this, '(', ')', ','),
            vscode.workspace.onDidChangeConfiguration(configurationChangeListener),
        );
    }

    /**
     * Provides an iterable of parser sessions.
     * This method simply passes all update sessions without filtration.
     * Subclass can override it to limit the scope.
     */
    protected async getUpdateSessionIteable(_document: vscode.TextDocument): Promise<Iterable<[string, T]>> {
        return this.updateSessionMap;
    }

    /**
     * Required implementation of vscode.CompletionItemProvider.
     */
    public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionList<lang.CompletionItem> | lang.CompletionItem[] | undefined> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        const wordType = getWordTypeInCommand(document, position);

        // *Specific to Igor Pro*: Completion items are selected contexually.

        // If it is a flag in operation, currently no suggestion.
        if (wordType === WordType.flag) {
            return;
        }

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages', suppressMessagesConfig);
        const suppressDetail = config['completionItem.label.detail'] ?? false;
        const suppressDescription = config['completionItem.label.description'] ?? false;
        const completionItems: lang.CompletionItem[] = [];
        const parserSessionIterable = await this.getUpdateSessionIteable(document);
        if (token.isCancellationRequested) { return; }

        for (const [uriString, session] of parserSessionIterable) {
            const refBook = (await session.promise)?.refBook;

            // Quit if cancelled and skip if symbol is not found in a file.
            if (token.isCancellationRequested) { return; }
            if (refBook === undefined) { continue; }

            let description: string | undefined;
            if (!suppressDescription) {
                if (uriString === lang.BUILTIN_URI || uriString === lang.OPERATION_URI || uriString === lang.EXTRA_URI) {
                    description = 'built-in';
                } else if (uriString === lang.EXTERNAL_URI) {
                    description = 'external';
                } else if (uriString === lang.ACTIVE_FILE_URI) {
                    description = 'local';
                } else {
                    description = vscode.workspace.asRelativePath(vscode.Uri.parse(uriString));
                }
            }

            for (const [identifier, refItem] of refBook.entries()) {
                // *Specific to Igor Pro*
                // Eliminate several categories.
                if (refItem.category !== 'constant' && refItem.category !== 'variable' && refItem.category !== 'function' && refItem.category !== 'operation' && refItem.category !== 'keyword') {
                    continue;
                }
                // Static symbols in another file are not used.
                if (refItem.isStatic && uriString !== document.uri.toString()) {
                    continue;
                }
                // Built-in functions are not allowed at the first word of the sentence.
                // Operations are allowed only at the first word of hte sentense.
                if (wordType === WordType.firstWord) {
                    if (refItem.category === 'function' && uriString === lang.BUILTIN_URI) {
                        continue;
                    }
                } else {
                    if (refItem.category === 'operation') {
                        continue;
                    }
                }
                // Skip items if unavailable.
                if (refItem.available && !satisfies(this.igorVersion, refItem.available.range)) {
                    continue;
                }

                // *Specific to Igor Pro*: Since an identifier is always small letters, 
                // use the first word in a signature as the label for completion item.
                if (!refItem.signature.toLowerCase().startsWith(identifier)) {
                    console.log('Error. mismatch with ID and signature', identifier, refItem.signature);
                    continue;
                }

                // Create completion item.
                const label = refItem.signature.substring(0, identifier.length);
                const detail = (!suppressDetail && refItem.signature.startsWith(identifier)) ? refItem.signature.substring(identifier.length) : undefined;
                const completionItem = new lang.CompletionItem({ label, detail, description }, uriString, refItem.category, refItem.isStatic ?? false);
                // if (refItem.snippet) {
                //     completionItem.insertText = new vscode.SnippetString(refItem.snippet);
                // }

                // Add "Deprecated" tag to the completion item.
                if (refItem.deprecated && satisfies(this.igorVersion, refItem.deprecated.range)) {
                    completionItem.tags = [vscode.CompletionItemTag.Deprecated];
                }

                // Add item to item list.
                completionItems.push(completionItem);
            }
        }

        return completionItems;
    }

    /**
     * Optional implementation of vscode.CompletionItemProvider.
     */
    public async resolveCompletionItem(completionItem: lang.CompletionItem, token: vscode.CancellationToken): Promise<lang.CompletionItem | undefined> {
        if (token.isCancellationRequested) { return; }

        const refUriString = completionItem.uriString;

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages', suppressMessagesConfig);
        const truncationlevel = config['completionItem.documentation'] === true ? TruncationLevel.line : TruncationLevel.paragraph;

        // Find the symbol information about the symbol.
        const label = typeof completionItem.label === 'string' ? completionItem.label : completionItem.label.label;
        const refItem = (await this.updateSessionMap.get(refUriString)?.promise)?.refBook.get(label.toLowerCase());

        // Quit if cancelled or symbol is not found in the file.
        if (token.isCancellationRequested) { return; }
        if (refItem === undefined) { return; }

        // Set the description of the completion item
        // If the main description exists, append it.
        const documentation = new vscode.MarkdownString(truncateString(truncationlevel, refItem));

        // If overloaded signature exists, append them.
        if (refItem.overloads) {
            for (const overload of refItem.overloads) {
                // documentation.appendMarkdown('---');
                documentation.appendCodeblock(overload.signature);
                const truncatedString = truncateString(truncationlevel, overload);
                if (truncatedString) {
                    documentation.appendMarkdown(truncatedString);
                }
            }
        }

        // Copy completion item and update its properties.
        const newCompletionItem = Object.assign({}, completionItem);
        const category = completionItem.category;
        const activeEditor = vscode.window.activeTextEditor;
        const documentUriString = activeEditor ? activeEditor.document.uri.toString() : '';
        newCompletionItem.detail = getShortDescription(refItem, category, refUriString, documentUriString, false);
        newCompletionItem.documentation = documentation;

        return newCompletionItem;
    }

    /**
     * Required implementation of vscode.HoverProvider.
     */
    public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        if (token.isCancellationRequested) { return; }

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages', suppressMessagesConfig);
        const truncationLevel = config['hover.contents'] === true ? TruncationLevel.paragraph : TruncationLevel.full;

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const wordType = getWordTypeInCommand(document, position);

        // *Specific to Igor Pro*: If it is a flag in operation, currently no suggestion.
        if (wordType === WordType.flag) {
            return undefined;
        }

        // *Specific to Igor Pro*: Use lower cases.
        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // Start to seek if the selection is a proper identifier.
        const contents: vscode.MarkdownString[] = [];
        const parserSessionIterable = await this.getUpdateSessionIteable(document);
        if (token.isCancellationRequested) { return; }


        for (const [uriString, session] of parserSessionIterable) {
            const refItem = (await session.promise)?.refBook.get(selectorName);

            // Quit if cancelled and skip if symbol is not found in a file.
            if (token.isCancellationRequested) { return; }
            if (refItem === undefined) { continue; }

            // *Specific to Igor Pro*: Also Skip in several cases.
            if (refItem.isStatic && uriString !== document.uri.toString()) {
                continue;
            }
            // Built-in functions are not allowed at the first word of the sentence.
            // Operations are allowed only at the first word of hte sentense.
            if (wordType === WordType.firstWord) {
                if (refItem.category === 'function' && uriString === lang.BUILTIN_URI) {
                    continue;
                }
            } else {
                if (refItem.category === 'operation') {
                    continue;
                }
            }

            // Create markdown text if symbol is found.
            let mainMarkdown = new vscode.MarkdownString(getShortDescription(refItem, refItem.category, uriString, document.uri.toString(), true));

            const truncatedString = truncateString(truncationLevel, refItem);
            if (truncatedString) {
                mainMarkdown = mainMarkdown.appendMarkdown(truncatedString);
            }
            contents.push(mainMarkdown);

            // For overloaded functions, prepare additional markdown blocks.
            if (refItem.overloads) {
                for (const overload of refItem.overloads) {
                    let overloadMarkdown = new vscode.MarkdownString().appendCodeblock(overload.signature);
                    const truncatedString2 = truncateString(truncationLevel, overload);
                    if (truncatedString2) {
                        overloadMarkdown = overloadMarkdown.appendMarkdown(truncatedString2);
                    }
                    contents.push(overloadMarkdown);
                }
            }
        }
        return contents.length > 0 ? new vscode.Hover(contents) : undefined;
    }

    /**
     * Required implementation of vscode.SignatureHelpProvider.
     */
    public async provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): Promise<vscode.SignatureHelp | undefined> {
        if (token.isCancellationRequested) { return; }

        const signatureHint = parseSignatureInEditing(document.lineAt(position.line).text, position.character);
        if (signatureHint === undefined) { return; }

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages', suppressMessagesConfig);
        const truncationLevel = config['signatureHelp.signatures.documentation'] === true ? TruncationLevel.paragraph : TruncationLevel.full;
        const parserSessionIterable = await this.getUpdateSessionIteable(document);
        if (token.isCancellationRequested) { return; }

        for (const [uriString, session] of parserSessionIterable) {
            const refItem = (await session.promise)?.refBook.get(signatureHint.signature);

            // Quit if cancelled and skip if symbol is not found in a file or symbol is not the one for function.
            if (token.isCancellationRequested) { return; }
            if (refItem === undefined || refItem.category !== 'function' || refItem.isStatic && uriString !== document.uri.toString()) {
                continue;
            }

            const signatureHelp = new vscode.SignatureHelp();
            const overloads = refItem.overloads ?? [{ signature: refItem.signature, description: refItem.description }];

            for (const overload of overloads) {
                // Assume that usage.signature must exist.
                const signatureInformation = new vscode.SignatureInformation(overload.signature);
                const truncatedString = truncateString(truncationLevel, overload);
                if (truncatedString) {
                    signatureInformation.documentation = new vscode.MarkdownString(truncatedString);
                }
                const parameters = getParameterInformation(overload.signature);
                if (parameters !== undefined) {
                    signatureInformation.parameters = parameters;
                }
                signatureHelp.signatures.push(signatureInformation);
            }

            signatureHelp.activeParameter = signatureHint.argumentIndex;

            if ((context.activeSignatureHelp !== undefined) && (context.activeSignatureHelp.signatures[0].label === signatureHelp.signatures[0].label)) {
                signatureHelp.activeSignature = context.activeSignatureHelp.activeSignature;
            } else {
                signatureHelp.activeSignature = 0;
            }

            if (signatureHelp.activeSignature >= signatureHelp.signatures.length) {
                signatureHelp.activeSignature = signatureHelp.signatures.length;
            }
            return signatureHelp;
        }
    }
}
