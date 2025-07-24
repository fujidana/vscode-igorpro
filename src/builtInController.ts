import * as vscode from 'vscode';
import * as lang from './language';
import { Controller } from "./controller";


type ReferenceConfiguration = { uriString: string, categories: readonly lang.ReferenceCategory[] };

const builtInConfigs: ReferenceConfiguration[] = [
    { uriString: lang.BUILTIN_URI, categories: ['constant', 'variable', 'structure', 'function', 'keyword'] },
    { uriString: lang.OPERATION_URI, categories: ['operation'] },
    { uriString: lang.EXTRA_URI, categories: ['subtype', 'pragma', 'hook'] },
];

/**
 * Provider subclass that manages built-in symbols.
 */
export class BuiltInController extends Controller implements vscode.TextDocumentContentProvider {
    public externalOperationIdentifiers: string[] = [];

    constructor(context: vscode.ExtensionContext) {
        super(context);

        // Load built-in symbol database from the JSON file.
        // ['picture', 'macro', 'undefined'] are not used for built-in symbol database.
        const builtInRefUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.builtIns.json');
        this.loadReferenceBooks(builtInRefUri, builtInConfigs);

        const onExternalRefBookLoadFulfilled = (parsedData: { refBook: lang.ReferenceBook }) => {
            // Collect identifiers of operations.
            this.externalOperationIdentifiers.splice(0); // Clear array elements.
            for (const [identifier, refItem] of parsedData.refBook.entries()) {
                if (refItem.category === 'operation') {
                    this.externalOperationIdentifiers.push(identifier);
                }
            }
            return parsedData;
        };

        // Load external symbol database from the JSON file.
        const externalRefFileUri = getExternalRefBookUri();
        if (externalRefFileUri) {
            const externalConfigs: ReferenceConfiguration[] = [
                { uriString: lang.EXTERNAL_URI, categories: lang.referenceCategoryNames }
            ];
            const promises = this.loadReferenceBooks(externalRefFileUri, externalConfigs);
            promises[0].then(
                onExternalRefBookLoadFulfilled,
                _reason => {
                    vscode.window.showErrorMessage(`Failed to load external symbols: ${externalRefFileUri.toString()}`, 'OK', 'Open Settings').then(
                        item => {
                            // Do not return a value so that the return value (promise-like object) of the function
                            // does not include waiting for an action against the dialog.
                            if (item === 'Open Settings') {
                                vscode.commands.executeCommand('workbench.action.openSettings', 'vscode-igorpro.suggest.symbolFile');
                            }
                        }
                    );
                    this.externalOperationIdentifiers.splice(0); // Clear array elements.
                    return undefined;
                }
            );
        } else {
            this.externalOperationIdentifiers.splice(0); // Clear array elements.
        }

        /** Event listener for configuration changes. */
        const configurationDidChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('vscode-igorpro.suggest.symbolFile')) {
                const externalRefFileUri = getExternalRefBookUri();
                if (externalRefFileUri) {
                    const externalParams: ReferenceConfiguration[] = [
                        { uriString: lang.EXTERNAL_URI, categories: lang.referenceCategoryNames }
                    ];
                    const promises = this.loadReferenceBooks(externalRefFileUri, externalParams);
                    promises[0].then(
                        onExternalRefBookLoadFulfilled,
                        _reason => {
                            vscode.window.showErrorMessage(`Failed to load external symbols: ${externalRefFileUri.toString()}`);
                            this.externalOperationIdentifiers.splice(0); // Clear array elements.
                            return undefined;
                        }
                    );
                } else {
                    this.externalOperationIdentifiers.splice(0); // Clear array elements.
                    this.updateSessionMap.delete(lang.EXTERNAL_URI);
                }
            }
        };

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
                const flag = vscode.workspace.getConfiguration('vscode-igorpro').get<boolean>('showSymbolsInPreview', true);
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
            // Register event handlers.
            vscode.workspace.onDidChangeConfiguration(configurationDidChangeListener),
        );
    }

    private loadReferenceBooks(fileUri: vscode.Uri, referenceConfigurations: ReferenceConfiguration[]) {
        const promisedLoadedFile = (async (fileUri: vscode.Uri) => {
            const uint8Array = await vscode.workspace.fs.readFile(fileUri);
            const decodedString = await vscode.workspace.decode(uint8Array, { encoding: 'utf8' });
            return JSON.parse(decodedString) as lang.ReferenceBookLike;
        })(fileUri);

        return referenceConfigurations.map(({ uriString, categories }) => {
            const promise = promisedLoadedFile.then(
                refBookLike => ({ refBook: lang.flattenRefBook(refBookLike, categories) }));
            this.updateSessionMap.set(uriString, { promise: promise });
            return promise;
        });
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
            let refBookLike: lang.ReferenceBookLike = {};
            for (const { uriString, categories } of builtInConfigs) {
                const refBook = (await this.updateSessionMap.get(uriString)?.promise)?.refBook;
                if (refBook) {
                    refBookLike = Object.assign(refBookLike, lang.categorizeRefBook(refBook, categories, false));
                }
            }

            if (token.isCancellationRequested) { return; }

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

/**
 * Get an URI object of the external symbol file whose path is specified in the settings.
 */
function getExternalRefBookUri() {
    const path = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<string>('symbolFile', '');
    if (path === "") {
        return undefined;
    } else if (path.startsWith('${workspaceFolder}/')) {
        if (vscode.workspace.workspaceFile) {
            return vscode.Uri.joinPath(vscode.workspace.workspaceFile, path.replace('${workspaceFolder}/', '../'));
        } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, path.replace('${workspaceFolder}/', './'));
        } else {
            vscode.window.showErrorMessage('Failed to get the path to the external symbol file because a workspace folder does not exist.');
            return undefined;
        }
    } else if (path.startsWith('${userHome}/')) {
        const homedir = process.env.HOME || process.env.USERPROFILE; // || os.homedir();
        if (homedir) {
            return vscode.Uri.joinPath(vscode.Uri.file(homedir), path.replace('${userHome}/', './'));
        } else {
            vscode.window.showErrorMessage('Failed to get the path to the external symbol file. "${userHome}" is unavailable on the web extesion.');
            return undefined;
        }
    } else {
        return vscode.Uri.file(path);
    }
}
