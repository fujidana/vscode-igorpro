import * as vscode from 'vscode';
import * as lang from './igorpro';
import { SemVer, satisfies } from 'semver';

interface SuppressMessagesConfig {
    'completionItem.label.detail'?: boolean
    'completionItem.label.description'?: boolean
    'completionItem.documentation'?: boolean
    'signatureHelp.signatures.documentation'?: boolean
    'hover.contents'?: boolean
}

function getStringOfSignatureAndComment(item: lang.ReferenceItem, itemKind: lang.ReferenceItemKind) {
    let symbolLabel: string;

    symbolLabel = lang.getReferenceItemKindMetadata(itemKind).label;

    let mainText = `${item.signature} // ${item.static ? 'static ' : ''}${symbolLabel}`;
    if (item.overloads && item.overloads.length > 1) {
        mainText += `, ${item.overloads.length} overloads`;
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
 * Provider class
 */
export class Provider implements vscode.CompletionItemProvider<lang.CompletionItem>, vscode.HoverProvider, vscode.SignatureHelpProvider {
    // vscode.Uri objects can not be used as a key for a Map object because these 
    // objects having the same string representation can be recognized different,
    // i.e., uriA.toString() === uriB.toString() but uriA !== uriB.
    // This is mainly caused by the difference in their minor properties, such as fsPath
    // (File System Path). To avoid this problem, the string representation of a Uri 
    // object is used as a key.

    protected readonly storageCollection = new Map<string, lang.ReferenceStorage>();
    protected readonly completionItemCollection = new Map<string, lang.CompletionItem[]>();
    protected igorVersion: SemVer;

    constructor(context: vscode.ExtensionContext) {
        this.igorVersion = getIgorVersion();

        const configurationChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('vscode-igorpro.suggest.suppressMessages')) {
                for (const uriString of this.storageCollection.keys()) {
                    this.updateCompletionItemsForUriString(uriString);
                }
            }
            if (event.affectsConfiguration('vscode-igorpro.igorVersion')) {
                this.igorVersion = getIgorVersion();
                for (const uriString of this.storageCollection.keys()) {
                    this.updateCompletionItemsForUriString(uriString);
                }
            }
        };

        // register providers
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(lang.SELECTOR, this),
            vscode.languages.registerHoverProvider(lang.SELECTOR, this),
            vscode.languages.registerSignatureHelpProvider(lang.SELECTOR, this, '(', ')', ','),
            vscode.workspace.onDidChangeConfiguration(configurationChangeListener),
        );
    }

    /**
     * Generate completion items from the registered storage and cache it in the map using `uri` as the key.
     * Subclass must invoke it when the storage contents are changed.
     */
    protected updateCompletionItemsForUriString(uriString: string): vscode.CompletionItem[] | undefined {
        const storage = this.storageCollection.get(uriString);
        if (storage) {
            const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
            const suppressDetail = config?.['completionItem.label.detail'] ?? false;
            const suppressDescription = config?.['completionItem.label.description'] ?? false;
            let description: string | undefined;

            if (!suppressDescription) {
                if (uriString === lang.BUILTIN_URI) {
                    description = 'built-in';
                    // } else if (uriString === igorpro.ACTIVE_FILE_URI) {
                    //     description = 'local';
                } else {
                    description = vscode.workspace.asRelativePath(vscode.Uri.parse(uriString));
                }
            }

            const completionItems: lang.CompletionItem[] = [];
            for (const [refItemKind, map] of storage.entries()) {
                // Suggest only constants, variables, functions, operations, and keywords. Skip the other types.
                if (refItemKind !== lang.ReferenceItemKind.constant && refItemKind !== lang.ReferenceItemKind.variable && refItemKind !== lang.ReferenceItemKind.function && refItemKind !== lang.ReferenceItemKind.operation && refItemKind !== lang.ReferenceItemKind.keyword) {
                    continue;
                }

                for (const [identifier, item] of map.entries()) {
                    if (item.available && !satisfies(this.igorVersion, item.available.range)) {
                        // do not add unsupported items to the completion list.
                        continue;
                    }

                    if (!item.signature.toLowerCase().startsWith(identifier)) {
                        console.log('error, mismatch with ID and signature', identifier, item.signature);
                        continue;
                    }

                    const label = item.signature.substring(0, identifier.length);
                    const detail = suppressDetail ? undefined : item.signature.substring(identifier.length);
                    const completionItem = new lang.CompletionItem(
                        { label, detail, description }, uriString, refItemKind, !!item.static
                    );
                    if (item.deprecated && satisfies(this.igorVersion, item.deprecated.range)) {
                        // add deprecated tag to the completion item.
                        completionItem.tags = [vscode.CompletionItemTag.Deprecated];
                    }
                    completionItems.push(completionItem);
                }
            }
            this.completionItemCollection.set(uriString, completionItems);

            return completionItems;
        } else {
            this.completionItemCollection.delete(uriString);
            return undefined;
        }
    }

    /**
     * Required implementation of vscode.CompletionItemProvider
     */
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList<lang.CompletionItem> | lang.CompletionItem[]> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        const wordType = getWordTypeInCommand(document, position);

        // If it is a flag in operation, currently no suggestion.
        if (wordType === WordType.flag) {
            return undefined;
        }

        const itemsArray = new Array<lang.CompletionItem[]>();
        for (const [uriString, items] of this.completionItemCollection) {
            if (uriString === lang.BUILTIN_URI) {
                itemsArray.push(items.filter(item => {
                    if (wordType === WordType.firstWord) {
                        return (item.kind === vscode.CompletionItemKind.Function) ? false : true;
                    } else {
                        return (item.kind === vscode.CompletionItemKind.Field) ? false : true;
                    }
                }));
            } else if (uriString !== document.uri.toString()) {
                itemsArray.push(items.filter(item => !item.isStatic));
            } else {
                itemsArray.push(items);
            }
        }

        return new Array<lang.CompletionItem>().concat(...itemsArray);
    }

    /**
     * Optional implementation of vscode.CompletionItemProvider
     */
    public resolveCompletionItem(completionItem: lang.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<lang.CompletionItem> {
        if (token.isCancellationRequested) { return; }

        const refItemKind = completionItem.refItemKind;
        const refUriString = completionItem.uriString;

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
        const truncationlevel = (config !== undefined && 'completionItem.documentation' in config && config['completionItem.documentation'] === true) ? TruncationLevel.line : TruncationLevel.paragraph;

        // find the symbol information about the symbol.
        const label = typeof completionItem.label === 'string' ? completionItem.label : completionItem.label.label;
        const refItem = this.storageCollection.get(refUriString)?.get(refItemKind)?.get(label.toLowerCase());
        if (refItem === undefined) { return; }

        // copy completion item.
        const newCompletionItem = Object.assign({}, completionItem);

        // set the description of the completion item
        // if the main description exists, append it.

        const documentation = new vscode.MarkdownString(truncateString(truncationlevel, refItem));

        // if overloaded signature exists, append them.
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

        // set the detail of the completion item
        newCompletionItem.detail = getStringOfSignatureAndComment(refItem, refItemKind);
        newCompletionItem.documentation = documentation;

        return newCompletionItem;
    }

    /**
     * required implementation of vscode.HoverProvider
     */
    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        if (token.isCancellationRequested) { return; }

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
        const truncationLevel = (config !== undefined && 'hover.contents' in config && config['hover.contents'] === true) ? TruncationLevel.paragraph : TruncationLevel.full;

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const wordType = getWordTypeInCommand(document, position);

        // If it is a flag in operation, currently no suggestion.
        if (wordType === WordType.flag) {
            return undefined;
        }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // start to seek if the selection is a proper identifier.
        const contents: vscode.MarkdownString[] = [];

        for (const [uriString, storage] of this.storageCollection.entries()) {
            for (const [itemKind, map] of storage.entries()) {
                // Built-in functions are not placed at the begining of the sentence.
                // Operations are placed only at the begining of the sentence.
                if (uriString === lang.BUILTIN_URI) {
                    if (wordType === WordType.firstWord) {
                        if (itemKind === lang.ReferenceItemKind.function) {
                            continue;
                        }
                    } else {
                        if (itemKind === lang.ReferenceItemKind.operation) {
                            continue;
                        }
                    }
                }

                // find the symbol information about the symbol.
                const item = map.get(selectorName);
                if (item && (!item.static || uriString === document.uri.toString())) {
                    let mainMarkdown = new vscode.MarkdownString().appendCodeblock(getStringOfSignatureAndComment(item, itemKind));

                    // prepare the second line: the description (if it exists)
                    const truncatedString = truncateString(truncationLevel, item);
                    if (truncatedString) {
                        mainMarkdown = mainMarkdown.appendMarkdown(truncatedString);
                    }
                    contents.push(mainMarkdown);

                    // for overloaded functions, prepare additional markdown blocks
                    if (item.overloads) {
                        for (const overload of item.overloads) {
                            let overloadMarkdown = new vscode.MarkdownString().appendCodeblock(overload.signature);
                            const truncatedString2 = truncateString(truncationLevel, overload);
                            if (truncatedString2) {
                                overloadMarkdown = overloadMarkdown.appendMarkdown(truncatedString2);
                            }
                            contents.push(overloadMarkdown);
                        }
                    }
                }
            }
        }
        return new vscode.Hover(contents);
    }

    /**
     * Required implementation of vscode.SignatureHelpProvider
     */
    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
        if (token.isCancellationRequested) { return; }

        const signatureHint = parseSignatureInEditing(document.lineAt(position.line).text, position.character);
        if (signatureHint === undefined) { return; }

        const config = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
        const truncationLevel = (config !== undefined && 'signatureHelp.signatures.documentation' in config && config['signatureHelp.signatures.documentation'] === true) ? TruncationLevel.paragraph : TruncationLevel.full;

        for (const [uriString, storage] of this.storageCollection.entries()) {
            const map = storage.get(lang.ReferenceItemKind.function);
            let item: lang.ReferenceItem | undefined;
            if (map && (item = map.get(signatureHint.signature)) !== undefined && (!item.static || uriString === document.uri.toString())) {
                const overloads = (item.overloads) ? item.overloads : [{ signature: item.signature, description: item.description }];
                const signatureHelp = new vscode.SignatureHelp();

                for (const overload of overloads) {
                    // assume that usage.signature must exist.
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
}
