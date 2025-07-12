import * as vscode from 'vscode';
import * as lang from './language';
import { Controller } from "./controller";

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
export class BuiltInController extends Controller implements vscode.TextDocumentContentProvider {
    // private activeWorkspaceFolder: vscode.WorkspaceFolder | undefined;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        // load the API reference file
        const builtInRefUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.builtIns.json');
        const promisedStorage = vscode.workspace.fs.readFile(builtInRefUri).then(uint8Array => {
            return vscode.workspace.decode(uint8Array, { encoding: 'utf8' });
        }).then(decodedString => {
            // convert JSON-formatted file contents to a javascript object.
            const apiReference: APIReference = JSON.parse(decodedString);

            // convert the object to ReferenceMap and register the set.
            const storage: lang.ReferenceStorage = new Map([
                [lang.ReferenceItemKind.constant, new Map(Object.entries(apiReference.constants))],
                [lang.ReferenceItemKind.variable, new Map(Object.entries(apiReference.variables))],
                [lang.ReferenceItemKind.function, new Map(Object.entries(apiReference.functions))],
                [lang.ReferenceItemKind.operation, new Map(Object.entries(apiReference.operations))],
                [lang.ReferenceItemKind.keyword, new Map(Object.entries(apiReference.keywords))],
                [lang.ReferenceItemKind.structure, new Map(Object.entries(apiReference.structures))],
                [lang.ReferenceItemKind.subtype, new Map(Object.entries(apiReference.subtypes))],
                [lang.ReferenceItemKind.pragma, new Map(Object.entries(apiReference.pragmas))],
                [lang.ReferenceItemKind.hook, new Map(Object.entries(apiReference.hooks))],
            ]);
            this.storageCollection.set(lang.BUILTIN_URI, storage);
            this.updateCompletionItemsForUriString(lang.BUILTIN_URI);
            return storage;
        });

        // callback function that shows reference manual as a virtual document
        const openReferenceManualCommandHandler = async () => {
            const storage = await promisedStorage;

            const quickPickItems = [{ key: 'all', label: '$(references) all' }];
            for (const itemKind of storage.keys()) {
                const metadata = lang.getReferenceItemKindMetadata(itemKind);
                quickPickItems.push({ key: metadata.label, label: `$(${metadata.iconIdentifier}) ${metadata.label}` });
            }
            const quickPickItem = await vscode.window.showQuickPick(quickPickItems);
            if (quickPickItem) {
                const uri = vscode.Uri.parse(lang.BUILTIN_URI).with({ query: quickPickItem.key });
                const editor = await vscode.window.showTextDocument(uri, { preview: false });
                const flag = vscode.workspace.getConfiguration('vscode-igorpro').get<boolean>('showReferenceManualInPreview');
                if (flag) {
                    await vscode.commands.executeCommand('markdown.showPreview');
                    // await vscode.window.showTextDocument(editor.document);
                    // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                }
            }
        };

        context.subscriptions.push(
            // register command handlers
            vscode.commands.registerCommand('igorpro.openReferenceManual', openReferenceManualCommandHandler),
            // register providers
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),
        );
    }

    /**
     * required implementation of vscode.TextDocumentContentProvider
     */
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        if (token.isCancellationRequested) { return; }

        const getFormattedStringForItem = (item: { signature?: string, description?: string, deprecated?: lang.VersionRange, available?: lang.VersionRange }) => {
            let mdText = `\`${item.signature}\``;
            mdText += item.description ? ` \u2014 ${item.description}\n\n` : '\n\n';
            if (item.available) {
                mdText += lang.getVersionRangeDescription(item.available, 'available') + '\n\n';
            }
            if (item.deprecated) {
                mdText += lang.getVersionRangeDescription(item.deprecated, 'deprecated') + '\n\n';
            }
            return mdText;
        };

        if (lang.BUILTIN_URI === uri.with({ query: '' }).toString()) {
            const storage = this.storageCollection.get(lang.BUILTIN_URI);
            if (storage) {
                let mdText = '# Igor Pro Reference Manual\n\n';
                mdText += 'The contents of this page are, except where otherwise noted, cited from the __Volume V Reference__ in [the official Igor Pro 9 manual](https://www.wavemetrics.com/products/igorpro/manual) or command helps in the in-app help browser, both written by [WaveMetrics, Inc.](https://www.wavemetrics.com/)\n\n';

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
                        // Keys in the database are lowercased for the sake of easy searching.
                        // If the case-insensitive match of the key with its signature is succeeded,
                        // use the value in the signature field.
                        if (item.signature && item.signature.substring(0, key.length).toLowerCase() === key) {
                            mdText += `### ${item.signature.substring(0, key.length)}\n\n`;
                        } else {
                            console.log('Mismatch between key and signature:', key, item.signature);
                            mdText += `### ${key}\n\n`;
                        }
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
