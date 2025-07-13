import * as vscode from 'vscode';
import * as lang from './language';
import { Controller } from "./controller";

/**
 * Provider subclass that manages built-in symbols.
 */
export class BuiltInController extends Controller implements vscode.TextDocumentContentProvider {
    // private activeWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    private promisedRefBooks;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        // Load built-in symbol database from the JSON file.
        const builtInRefUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.builtIns.json');
        this.promisedRefBooks = vscode.workspace.fs.readFile(builtInRefUri).then(uint8Array => {
            return vscode.workspace.decode(uint8Array, { encoding: 'utf8' });
        }).then(decodedString => {
            // convert JSON-formatted file contents to a javascript object.
            const refBookLike: lang.ReferenceBookLike = JSON.parse(decodedString);

            // ['picture', 'macro', 'undefined'] are not used.
            const builtInsParams: { uriString: string, categories: lang.ReferenceCategory[], referenceBook?: lang.ReferenceBook }[] = [
                { uriString: lang.BUILTIN_URI, categories: ['constant', 'variable', 'structure', 'function', 'keyword'] },
                { uriString: lang.OPERATION_URI, categories: ['operation'] },
                { uriString: lang.EXTRA_URI, categories: ['subtype', 'pragma', 'hook'] },
            ];
            builtInsParams.forEach(param => {
                const refBook = lang.flattenRefBook(refBookLike, param.categories);
                // Register it in the database.
                this.referenceCollection.set(param.uriString, refBook);
                this.updateCompletionItemsForUriString(param.uriString);
                param.referenceBook = refBook;
            });
            return builtInsParams;
        });

        /** Command handler fow showing built-in symbols as a virtual document. */
        const showBuiltInSymbolsCommandHandler = async () => {
            // ['picture', 'macro', 'undefined'] are not used.
            const categories = ['constant', 'variable', 'structure', 'function', 'operation', 'keyword', 'subtype', 'pragma', 'hook'] as const;
            const quickPickItems = [{ category: 'all', label: '$(references) all' }];
            for (const category of categories) {
                const metadata = lang.referenceCategoryMetadata[category];
                quickPickItems.push({ category: category, label: `$(${metadata.iconIdentifier}) ${metadata.label}` });
            }
            const quickPickItem = await vscode.window.showQuickPick(quickPickItems);
            if (quickPickItem) {
                const uri = vscode.Uri.parse(lang.BUILTIN_URI).with({ query: quickPickItem.category });
                const editor = await vscode.window.showTextDocument(uri, { preview: false });
                const flag = vscode.workspace.getConfiguration('vscode-igorpro').get<boolean>('showReferenceManualInPreview');
                if (flag) {
                    await vscode.commands.executeCommand('markdown.showPreview');
                    // await vscode.window.showTextDocument(editor.document);
                    // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                }
            }
        };

        // Register command and event handlers.
        context.subscriptions.push(
            // Register command handlers.
            vscode.commands.registerCommand('igorpro.showBuiltInSymbols', showBuiltInSymbolsCommandHandler),
            // Register providers.
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),
        );
    }

    /**
     * Required implementation of vscode.TextDocumentContentProvider.
     */
    public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string | undefined> {
        if (token.isCancellationRequested) { return; }

        const getFormattedStringForItem = (item: { signature: string, description?: string, deprecated?: lang.VersionRange, available?: lang.VersionRange }) => {
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
            const refBookParams = await this.promisedRefBooks;

            const refBookLike = refBookParams.map(
                param => param.referenceBook ? lang.categorizeRefBook(param.referenceBook, param.categories) : {}
            ).reduce(
                (left, right) => Object.assign(left, right)
            );

            let mdText = '# Igor Pro Built-in Symbols\n\n';
            mdText += 'The contents of this page are, except where otherwise noted, cited from the __Volume V Reference__ in [the official Igor Pro 9 manual](https://www.wavemetrics.com/products/igorpro/manual) or command helps in the in-app help browser, both written by [WaveMetrics, Inc.](https://www.wavemetrics.com/)\n\n';

            for (const [category, refSheet] of Object.entries(refBookLike)) {
                // If 'query' is not 'all', skip maps other than the speficed query.
                if (uri.query && uri.query !== 'all' && uri.query !== category) {
                    continue;
                }

                // Add heading for each category.
                mdText += `## ${lang.referenceCategoryMetadata[category as keyof typeof refBookLike].label}\n\n`;

                // Add each item.
                for (const [identifier, refItemLike] of Object.entries(refSheet)) {
                    // *Specific to Igor Pro*: Keys (identifiers) in the database are lowercased.
                    // If the case-insensitive match of the key with its signature is succeeded,
                    // use the value in the signature field.
                    if (refItemLike.signature && refItemLike.signature.substring(0, identifier.length).toLowerCase() === identifier) {
                        mdText += `### ${refItemLike.signature.substring(0, identifier.length)}\n\n`;
                    } else {
                        console.log('Mismatch between key and signature:', identifier, refItemLike.signature);
                        mdText += `### ${identifier}\n\n`;
                    }
                    mdText += getFormattedStringForItem(refItemLike);
                    if (refItemLike.overloads) {
                        for (const overload of refItemLike.overloads) {
                            mdText += getFormattedStringForItem(overload);
                        }
                    }
                }
            }
            return mdText;
        }
    }
}
