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
 * Provider subclass that manages built-in and user-defined symbols.
 */
export class DictionaryController extends Controller<lang.UpdateSession<lang.DictParserResult>> implements vscode.TextDocumentContentProvider {
    private readonly extensionSchemaUriString: string;
    public externalOperationIdentifiers: string[] = [];

    constructor(context: vscode.ExtensionContext) {
        super(context);

        this.extensionSchemaUriString = vscode.Uri.joinPath(context.extensionUri, 'schema', 'ipdict.schema.json').toString();

        // Load built-in symbol database from the JSON file.
        // ['picture', 'macro', 'undefined'] are not used for built-in symbol database.
        const builtInRefUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.ipdict.json');
        this.loadReferenceBooks(builtInRefUri, builtInConfigs, 'builtin');

        // Load external symbol database from the JSON file.
        const externalRefUri = getExternalRefBookUri('external2');
        if (externalRefUri) {
            const externalConfigs: ReferenceConfiguration[] = [
                { uriString: lang.EXTERNAL_URI, categories: lang.referenceCategoryNames }
            ];
            this.loadReferenceBooks(externalRefUri, externalConfigs, 'external2');
        } else {
            this.externalOperationIdentifiers.splice(0); // Clear array elements.
        }

        /** Event listener for configuration changes. */
        const configurationDidChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('vscode-igorpro.suggest.symbolFile')) {
                const externalRefUri = getExternalRefBookUri('external');
                if (externalRefUri) {
                    const externalParams: ReferenceConfiguration[] = [
                        { uriString: lang.EXTERNAL_URI, categories: lang.referenceCategoryNames }
                    ];
                    this.loadReferenceBooks(externalRefUri, externalParams, 'external');
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
                quickPickItems.push({
                    category: category,
                    label: `$(${lang.getIconIdentifierForCategory(category)}) ${lang.getLabelForCategory(category)}`
                });
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
            vscode.commands.registerCommand('vscode-igorpro.showBuiltInSymbols', showBuiltInSymbolsCommandHandler),
            // Register providers.
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),
            // Register event handlers.
            vscode.workspace.onDidChangeConfiguration(configurationDidChangeListener),
        );
    }

    private async loadReferenceBooks(fileUri: vscode.Uri, referenceConfigurations: ReferenceConfiguration[], mode: 'builtin' | 'external' | 'external2') {
        try {
            const uint8Array = await vscode.workspace.fs.readFile(fileUri);
            const decodedString = await vscode.workspace.decode(uint8Array, { encoding: 'utf8' });
            const dictionary: lang.CategorizedDictionary = JSON.parse(decodedString);

            if (mode !== 'builtin') {
                const operationEntries = dictionary.categories.operation;
                if (operationEntries) {
                    this.externalOperationIdentifiers.push(...Object.keys(operationEntries));
                }
            }

            for (const { uriString, categories } of referenceConfigurations) {
                const parserResult = lang.convertFromCategorizedDictionary(dictionary, categories);
                this.updateSessionMap.set(uriString, { promise: Promise.resolve(parserResult) });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const message = mode === 'builtin' ?
                vscode.l10n.t('Failed to load built-in symbols. {0}', errorMessage) :
                vscode.l10n.t('Failed to load external symbols. {0}', errorMessage);
            const buttons = mode === 'external2' ?
                [vscode.l10n.t('OK'), vscode.l10n.t('Open Settings')] :
                [];

            // Do not return a thenable object chained to `showErrorMessage()` so 
            // that the return value of the function is resolved before the user
            // takes an action against the dialog.
            vscode.window.showErrorMessage(message, ...buttons).then(
                button => {
                    if (button === vscode.l10n.t('Open Settings')) {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'vscode-igorpro.suggest.symbolFile');
                    }
                }
            );
            if (mode !== 'builtin') {
                this.externalOperationIdentifiers.splice(0); // Clear array elements.
            }
            return undefined;
        }
    }

    // Override the method in the base class to provide custom descriptions for completion items.
    // For entries in a built-in or user-defined dictionary, it returns a descriptive label.
    protected override getCompletionItemLabelDescription(uriString: string): string | undefined {
        if (uriString === lang.BUILTIN_URI || uriString === lang.OPERATION_URI || uriString === lang.EXTRA_URI) {
            return 'built-in';
        } else if (uriString === lang.EXTERNAL_URI) {
            return 'external';
        } else {
            return undefined;
        }
    }

    // Override the method in the base class to provide short text on hover and resolved completion items.
    protected override getSignatureComment(categoryLabel: string, uriString: string): string {
        if (uriString === lang.BUILTIN_URI || uriString === lang.OPERATION_URI || uriString === lang.EXTRA_URI) {
            return 'built-in ' + categoryLabel;
        } else if (uriString === lang.EXTERNAL_URI) {
            return 'external ' + categoryLabel;
        } else {
            return categoryLabel;
        }
    }

    // Required implementation of vscode.TextDocumentContentProvider.
    public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string | undefined> {
        if (token.isCancellationRequested) { return; }

        const getFormattedStringForItem = (item: Omit<lang.ReferenceItem, 'category'>) => {
            let mdText = `\`${item.signature}\``;
            mdText += item.description ? ` \u2014 ${item.description}\n\n` : '\n\n';
            if (item.available) {
                mdText += lang.getVersionRangeDescription(item.available, 'available') + '\n\n';
            }
            if (item.deprecated) {
                mdText += lang.getVersionRangeDescription(item.deprecated, 'deprecated') + '\n\n';
            }
            if (item.overloads) {
                for (const overload of item.overloads) {
                    mdText += getFormattedStringForItem(overload);
                }
            }
            return mdText;
        };

        if (lang.BUILTIN_URI === uri.with({ query: '' }).toString()) {
            const dictionaries: lang.CategorizedDictionary[] = [];
            for (const { uriString, categories } of builtInConfigs) {
                const parserResult = await this.updateSessionMap.get(uriString)?.promise;
                if (parserResult) {
                    dictionaries.push(lang.convertToCategorizedDictionary(parserResult, categories, false));
                }
            }

            if (token.isCancellationRequested) { return; }
            if (dictionaries.length === 0) { return; }

            // Merge dictionaries containing different categories into one dictionary. 
            // Merging must be done after the entries are classified into categories to avoid
            // entries having the same identifier but classified in different categories
            // (concretely, `note()` function and `Note` operation) being merged into one entry.
            const dictionary = dictionaries[0];
            for (let i = 1; i < dictionaries.length; i++) {
                for (const [category, entries] of Object.entries(dictionaries[i].categories)) {
                    dictionary.categories[category as keyof lang.CategorizedDictionary['categories']] = entries;
                }
            }

            let mdText = '# Igor Pro Built-in Symbols\n\n';
            mdText += 'The contents of this page are, except where otherwise noted, cited from the __Volume V Reference__ in [the official Igor Pro 9 manual](https://www.wavemetrics.com/products/igorpro/manual) or command helps in the in-app help browser, both written by [WaveMetrics, Inc.](https://www.wavemetrics.com/)\n\n';

            for (const [categoryName, entriesInCategory] of Object.entries(dictionary.categories)) {
                // If 'query' is not 'all', skip maps other than the speficed query.
                if (uri.query && uri.query !== 'all' && uri.query !== categoryName) {
                    continue;
                }

                // Add heading for each category.
                mdText += `## ${lang.getLabelForCategory(categoryName as keyof typeof dictionary.categories)}\n\n`;

                // Add each item.
                for (const [identifier, entry] of Object.entries(entriesInCategory)) {
                    // *Specific to Igor Pro*: Keys (identifiers) in the database are lowercased.
                    // If the case-insensitive match of the key with its signature is succeeded,
                    // use the value in the signature field.
                    if (entry.signature && entry.signature.substring(0, identifier.length).toLowerCase() === identifier) {
                        mdText += `### ${entry.signature.substring(0, identifier.length)}\n\n`;
                    } else {
                        console.log('Mismatch between key and signature:', identifier, entry.signature);
                        mdText += `### ${identifier}\n\n`;
                    }

                    mdText += getFormattedStringForItem(entry);
                }
            }
            return mdText;
        }
    }
}

/**
 * Get an URI object of the external symbol file whose path is specified in the settings.
 */
function getExternalRefBookUri(mode: 'external' | 'external2'): vscode.Uri | undefined {
    const path = vscode.workspace.getConfiguration('vscode-igorpro.suggest').get<string>('symbolFile', '');

    const buttons = mode === 'external2' ?
        [vscode.l10n.t('OK'), vscode.l10n.t('Open Settings')] :
        [];
    const action = (button: string | undefined) => {
        if (button === vscode.l10n.t('Open Settings')) {
            vscode.commands.executeCommand('workbench.action.openSettings', 'vscode-igorpro.suggest.symbolFile');
        }
    };

    if (path === '') {
        return undefined;
    } else if (path.startsWith('${workspaceFolder}/')) {
        if (vscode.workspace.workspaceFile) {
            return vscode.Uri.joinPath(vscode.workspace.workspaceFile, path.replace('${workspaceFolder}/', '../'));
        } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, path.replace('${workspaceFolder}/', './'));
        } else {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Failed to get the path to the external symbol file because a workspace folder does not exist.'),
                ...buttons
            ).then(action);
            return undefined;
        }
    } else if (path.startsWith('${userHome}/')) {
        const homedir = process.env.HOME || process.env.USERPROFILE; // || os.homedir();
        if (homedir) {
            return vscode.Uri.joinPath(vscode.Uri.file(homedir), path.replace('${userHome}/', './'));
        } else {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Failed to get the path to the external symbol file because "{0}" is unavailable on the web extension.', '${userHome}'),
                ...buttons
            ).then(action);
            return undefined;
        }
    } else {
        return vscode.Uri.file(path);
    }
}
