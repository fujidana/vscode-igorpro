import * as vscode from 'vscode';
import * as igorpro from './igorpro';

/* eslint-disable @typescript-eslint/naming-convention */
interface SuppressMessagesConfig {
    'completionItem.label.detail'?: boolean
    'completionItem.label.description'?: boolean
    'completionItem.documentation'?: boolean
    'signatureHelp.signatures.documentation'?: boolean
    'hover.contents'?: boolean
}
/* eslint-enable @typescript-eslint/naming-convention */

function getStringOfSignatureAndComment(item: igorpro.ReferenceItem, itemKind: igorpro.ReferenceItemKind) {
    let symbolLabel: string;

    symbolLabel = igorpro.getReferenceItemKindMetadata(itemKind).label;

    let mainText = `${item.signature} // ${symbolLabel}`;
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

function truncateString(level: TruncationLevel, item: { description?: string, deprecatedMessage?: string, minimumVersion?: number }): string | undefined {
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
        if (item.minimumVersion) {
            const tmpStr = `It was added in Igor Pro ${item.minimumVersion.toFixed(2)}.`;
            truncatedString = truncatedString ? truncatedString + '\n\n' + tmpStr : tmpStr;
        }

        if (item.deprecatedMessage) {
            const tmpStr = '__deprecated:__ ' + item.deprecatedMessage;
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
export class Provider implements vscode.CompletionItemProvider<igorpro.CompletionItem>, vscode.HoverProvider, vscode.SignatureHelpProvider {
    // vscode.Uri objects can not be used as a key for a Map object because these 
    // objects having the same string representation can be recognized different,
    // i.e., uriA.toString() === uriB.toString() but uriA !== uriB.
    // This is mainly caused by the difference in their minor properties, such as fsPath
    // (File System Path). To avoid this problem, the string representation of a Uri 
    // object is used as a key.

    protected readonly storageCollection = new Map<string, igorpro.ReferenceStorage>();
    protected readonly completionItemCollection = new Map<string, igorpro.CompletionItem[]>();

    constructor(context: vscode.ExtensionContext) {
        const configurationChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('igorpro.suggest.suppressMessages')) {
                for (const uriString of this.storageCollection.keys()) {
                    this.updateCompletionItemsForUriString(uriString);
                }
            }
        };

        // register providers
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(igorpro.CMD_SELECTOR, this),
            vscode.languages.registerHoverProvider(igorpro.CMD_SELECTOR, this),
            vscode.languages.registerSignatureHelpProvider(igorpro.CMD_SELECTOR, this, '(', ')', ','),
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
            const config = vscode.workspace.getConfiguration('igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
            const suppressDetail = config !== undefined && 'completionItem.label.detail' in config && config['completionItem.label.detail'] === true;
            const suppressDescription = config !== undefined && 'completionItem.label.description' in config && config['completionItem.label.description'] === true;
            let description: string | undefined;

            if (!suppressDescription) {
                description = 'built-in';
            }

            const completionItems: igorpro.CompletionItem[] = [];
            for (const [refItemKind, map] of storage.entries()) {
                // Suggest only constants, variables, functions, operations, and keywords. Skip the other types.
                if (refItemKind !== igorpro.ReferenceItemKind.constant && refItemKind !== igorpro.ReferenceItemKind.variable && refItemKind !== igorpro.ReferenceItemKind.function && refItemKind !== igorpro.ReferenceItemKind.operation && refItemKind !== igorpro.ReferenceItemKind.keyword) {
                    continue;
                }

                for (const [identifier, item] of map.entries()) {
                    if (item.deprecatedMessage) {
                        // do not include deprecated items from the completion list.
                        continue;
                    }

                    if (!item.signature.toLowerCase().startsWith(identifier)) {
                        console.log('error, mismatch with ID and signature', identifier, item.signature);
                        continue;
                    }

                    const label = item.signature.substring(0, identifier.length);
                    const detail = suppressDetail ? undefined : item.signature.substring(identifier.length);
                    const completionItem = new igorpro.CompletionItem(
                        { label, detail, description }, uriString, refItemKind
                    );
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
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList<igorpro.CompletionItem> | igorpro.CompletionItem[]> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }
    
        const selectorName = document.getText(range);
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(selectorName)) { return; }

        const wordType = getWordTypeInCommand(document, position);

        // If it is flag, currently no suggestion.
        if (wordType === WordType.flag) {
            return null;
        }

        const itemsArray = new Array<igorpro.CompletionItem[]>();
        for (const [uriString, items] of this.completionItemCollection) {
            if (uriString === igorpro.BUILTIN_URI) {
                itemsArray.push(items.filter(item => {
                    if (wordType === WordType.firstWord) {
                        return (item.kind === vscode.CompletionItemKind.Function) ? false : true;
                    } else {
                        return (item.kind === vscode.CompletionItemKind.Module) ? false : true;
                    }
                }));
            } else {
                itemsArray.push(items);
            }
        }

        return new Array<igorpro.CompletionItem>().concat(...itemsArray);
    }

    /**
     * Optional implementation of vscode.CompletionItemProvider
     */
    public resolveCompletionItem(completionItem: igorpro.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<igorpro.CompletionItem> {
        if (token.isCancellationRequested) { return; }

        const refItemKind = completionItem.refItemKind;
        const refUriString = completionItem.uriString;

        const config = vscode.workspace.getConfiguration('igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
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

        const config = vscode.workspace.getConfiguration('igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
        const truncationLevel = (config !== undefined && 'hover.contents' in config && config['hover.contents'] === true) ? TruncationLevel.paragraph : TruncationLevel.full;

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }
    
        const wordType = getWordTypeInCommand(document, position);
    
        // If it is flag, currently no suggestion.
        if (wordType === WordType.flag) {
            return null;
        }
    
        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // start to seek if the selection is a proper identifier.
        const hovers: vscode.MarkdownString[] = [];

        for (const [uriString, storage] of this.storageCollection.entries()) {
            for (const [itemKind, map] of storage.entries()) {
                // Built-in functions are not placed at the begining of the sentence.
                // Operations are placed only at the begining of the sentence.
                if (uriString === igorpro.BUILTIN_URI) {
                    if (wordType === WordType.firstWord) {
                        if (itemKind === igorpro.ReferenceItemKind.function) {
                            continue;
                        }
                    } else {
                        if (itemKind === igorpro.ReferenceItemKind.operation) {
                            continue;
                        }
                    }
                }

                // find the symbol information about the symbol.
                const item = map.get(selectorName);
                if (item) {
                    let mainMarkdown = new vscode.MarkdownString().appendCodeblock(getStringOfSignatureAndComment(item, itemKind));

                    // prepare the second line: the description (if it exists)
                    const truncatedString = truncateString(truncationLevel, item);
                    if (truncatedString) {
                        mainMarkdown = mainMarkdown.appendMarkdown(truncatedString);
                    }
                    hovers.push(mainMarkdown);

                    // for overloaded functions, prepare additional markdown blocks
                    if (item.overloads) {
                        for (const overload of item.overloads) {
                            let overloadMarkdown = new vscode.MarkdownString().appendCodeblock(overload.signature);
                            const truncatedString2 = truncateString(truncationLevel, overload);
                            if (truncatedString2) {
                                overloadMarkdown = overloadMarkdown.appendMarkdown(truncatedString2);
                            }
                            hovers.push(overloadMarkdown);
                        }
                    }
                }
            }
        }
        return new vscode.Hover(hovers);
    }

    /**
     * Required implementation of vscode.SignatureHelpProvider
     */
    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
        if (token.isCancellationRequested) { return; }

        const signatureHint = parseSignatureInEditing(document.lineAt(position.line).text, position.character);
        if (signatureHint === undefined) { return; }

        const config = vscode.workspace.getConfiguration('igorpro.suggest').get<SuppressMessagesConfig>('suppressMessages');
        const truncationLevel = (config !== undefined && 'signatureHelp.signatures.documentation' in config && config['signatureHelp.signatures.documentation'] === true) ? TruncationLevel.paragraph : TruncationLevel.full;

        for (const storage of this.storageCollection.values()) {
            const map = storage.get(igorpro.ReferenceItemKind.function);
            let item: igorpro.ReferenceItem | undefined;
            if (map && (item = map.get(signatureHint.signature)) !== undefined) {
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
