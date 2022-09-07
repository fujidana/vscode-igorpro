import * as vscode from 'vscode';
import * as lang from './igorpro';
import { Provider } from "./provider";
import { TextDecoder } from 'util';

interface APIReference {
    constants: lang.ReferenceItem[];
    variables: lang.ReferenceItem[];
    functions: lang.ReferenceItem[];
    operations: lang.ReferenceItem[];
    keywords: lang.ReferenceItem[];
    structures: lang.ReferenceItem[];
    subtypes: lang.ReferenceItem[];
    pragmas: lang.ReferenceItem[];
    hooks: lang.ReferenceItem[];
}

/**
 * Provider subclass that manages built-in symbols.
 */
export class SystemProvider extends Provider implements vscode.TextDocumentContentProvider {
    // private activeWorkspaceFolder: vscode.WorkspaceFolder | undefined;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        // load the API reference file
        const apiReferenceUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.apiReference.json');
        vscode.workspace.fs.readFile(apiReferenceUri).then(uint8Array => {
            // convert JSON-formatted file contents to a javascript object.
            const apiReference: APIReference = JSON.parse(new TextDecoder('utf-8').decode(uint8Array));

            // convert the object to ReferenceMap and register the set.
            this.storageCollection.set(lang.BUILTIN_URI, new Map([
                [lang.ReferenceItemKind.constant, new Map(Object.entries(apiReference.constants))],
                [lang.ReferenceItemKind.variable, new Map(Object.entries(apiReference.variables))],
                [lang.ReferenceItemKind.function, new Map(Object.entries(apiReference.functions))],
                [lang.ReferenceItemKind.operation, new Map(Object.entries(apiReference.operations))],
                [lang.ReferenceItemKind.keyword, new Map(Object.entries(apiReference.keywords))],
                [lang.ReferenceItemKind.structure, new Map(Object.entries(apiReference.structures))],
                [lang.ReferenceItemKind.subtype, new Map(Object.entries(apiReference.subtypes))],
                [lang.ReferenceItemKind.pragma, new Map(Object.entries(apiReference.pragmas))],
                [lang.ReferenceItemKind.hook, new Map(Object.entries(apiReference.hooks))],
            ]));
            this.updateCompletionItemsForUriString(lang.BUILTIN_URI);
        });

        // register command to show reference manual as a virtual document
        const openReferenceManualCallback = () => {
            const showReferenceManual = async (storage: lang.ReferenceStorage) => {
                const quickPickItems = [{ key: 'all', label: '$(references) all' }];
                for (const itemKind of storage.keys()) {
                    const metadata = lang.getReferenceItemKindMetadata(itemKind);
                    quickPickItems.push({ key: metadata.label, label: `$(${metadata.iconIdentifier}) ${metadata.label}` });
                }
                const quickPickItem = await vscode.window.showQuickPick(quickPickItems);
                if (quickPickItem) {
                    const uri = vscode.Uri.parse(lang.BUILTIN_URI).with({ query: quickPickItem.key });
                    const editor = await vscode.window.showTextDocument(uri, { preview: false });
                    const flag = vscode.workspace.getConfiguration('igorpro').get<boolean>('showReferenceManualInPreview');
                    if (flag) {
                        await vscode.commands.executeCommand('markdown.showPreview');
                        // await vscode.window.showTextDocument(editor.document);
                        // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    }
                }
            };

            // The API reference database may have not been loaded 
            // in case this command activates the extension.
            // Therefore, wait until the database is loaded or 0.05 * 5 seconds passes.
            let trial = 0;
            const timer = setInterval(() => {
                const storage = this.storageCollection.get(lang.BUILTIN_URI);
                if (storage) {
                    clearInterval(timer);
                    showReferenceManual(storage);
                } else if (trial >= 5) {
                    clearInterval(timer);
                    vscode.window.showErrorMessage('Timeout. The API reference database is not loaded at the moment.');
                }
                trial++;
            }, 50);
        };

        context.subscriptions.push(
            // register command handlers
            vscode.commands.registerCommand('igorpro.openReferenceManual', openReferenceManualCallback),
            // register providers
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),
        );
    }

    /**
     * required implementation of vscode.TextDocumentContentProvider
     */
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        if (token.isCancellationRequested) { return; }

        const getFormattedStringForItem = (item: { signature?: string, description?: string, deprecatedMessage?: string, minimumVersion?: number }) => {
            let mdText = `\`${item.signature}\``;
            mdText += item.description ? ` \u2014 ${item.description}\n\n` : '\n\n';
            mdText += item.deprecatedMessage ? `__deprecated:__ ${item.deprecatedMessage}\n\n` : '';
            mdText += item.minimumVersion ? `It was added in Igor Pro ${item.minimumVersion.toFixed(2)}.\n\n` : '';
            return mdText;
        };

        if (uri.scheme === 'igorpro' && uri.authority === 'system') {
            const storage = this.storageCollection.get(uri.with({ query: '' }).toString());
            if (storage) {
                let mdText = '# Igor Pro Reference Manual\n\n';
                mdText += 'The contents of this page are, except where otherwise noted, cited from the __Volume V Reference__ in [the official Igor Pro 9 manual](https://www.wavemetrics.com/products/igorpro/manual) and command helps in the in-app help browser, both written by [WaveMetrics, Inc.](https://www.wavemetrics.com/)\n\n';

                for (const [itemKind, map] of storage.entries()) {
                    const itemKindLabel = lang.getReferenceItemKindMetadata(itemKind).label;

                    // if 'query' is not 'all', skip maps other than the speficed query.
                    if (uri.query && uri.query !== 'all' && uri.query !== itemKindLabel) {
                        continue;
                    }

                    // add heading for each category
                    mdText += `## ${itemKindLabel}\n\n`;

                    // add each item
                    for (const [key, item] of map.entries()) {
                        mdText += `### ${key}\n\n`;
                        mdText += getFormattedStringForItem(item);
                        if (item.overloads) {
                            for (const overload of item.overloads) {
                                mdText += getFormattedStringForItem(overload);
                            }
                        }
                    }
                }
                return mdText;
            }
        }
    }
}
