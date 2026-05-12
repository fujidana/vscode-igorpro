import * as vscode from 'vscode';
import * as lang from './language';
import { Controller } from './controller';

export const BUILTIN_DICT_URI = 'igorpro://extension/builtins';
const OPERATION_DICT_URI = 'igorpro://extension/operation';
const EXTRA_DICT_URI = 'igorpro://extension/extra';
const GLOBAL_DICT_BASEURI = 'igorpro://global/global';
const WORKSPACE_DICT_BASEURI = 'igorpro://workspace/workspace';

/**
 * A list of 2-tuples, each containing a virtual URI for a dictionary and the 
 * categories of symbols included in that dictionary.
 * 
 * The extension internally uses Map objects for efficient symbol lookup.
 * The identifiers of several built-in symbols are duplicated across different 
 * categories (e.g. `note()` function and `Note` operation).
 * To avoid overwriting entries with the same identifier, the built-in sybmols
 * defined in a single JSON file are split into multiple Map objects according 
 * to their categories.
 * 
 * `picture` or `macro` is not included in the built-in symbol database.
 */
const extensionDictionaryEntries: [string, lang.ReferenceCategory[]][] = [
    [BUILTIN_DICT_URI, ['constant', 'variable', 'structure', 'function', 'keyword']],
    [OPERATION_DICT_URI, ['operation']],
    [EXTRA_DICT_URI, ['subtype', 'pragma', 'hook']]
];

/**
 * Provider subclass that manages built-in and user-defined symbols.
 */
export class DictionaryController extends Controller<lang.UpdateSession<lang.DictParserResult>> implements vscode.TextDocumentContentProvider {
    private readonly extensionSchemaUriString: string;
    public externalOperationMap: Map<string, string[]> = new Map();
    public fileController: Controller | undefined;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        this.extensionSchemaUriString = vscode.Uri.joinPath(context.extensionUri, 'schema', 'ipdict.schema.json').toString();

        // Load built-in symbol database from a JSON file bundled in the extension.
        const builtInRefUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.ipdict.json');
        this.loadExtensionDictionary(builtInRefUri);

        // Load user-defined symbol database from the global (user) and workspace state.
        const stateParams = [
            { baseUriString: GLOBAL_DICT_BASEURI, memento: context.globalState },
            { baseUriString: WORKSPACE_DICT_BASEURI, memento: context.workspaceState }
        ];

        for (const { baseUriString, memento } of stateParams) {
            // Skip loading user-defined symbol database from the workspace state 
            // if the workspace is not trusted, to avoid potential security risks.
            if (baseUriString === WORKSPACE_DICT_BASEURI && !vscode.workspace.isTrusted) {
                continue;
            }

            for (const key of memento.keys()) {
                const obj = memento.get(key);
                if (
                    obj && typeof obj === 'object' &&
                    'kind' in obj && obj.kind === 'igorpro.dictionary' &&
                    'identifier' in obj && typeof obj.identifier === 'string'
                ) {
                    const obj2 = obj as lang.CategorizedDictionary;
                    const uriString = baseUriString + '/' + obj2.identifier;
                    const promise = new Promise<lang.DictParserResult>(resolve => {
                        // [Igor Pro specific code]
                        // Extract operation identifiers and store them for later use in the file controller.
                        if (obj2.categories.operation) {
                            this.externalOperationMap.set(uriString, Object.keys(obj2.categories.operation));
                        } else {
                            this.externalOperationMap.set(uriString, []);
                        }
                        resolve(lang.convertFromCategorizedDictionary(obj2));
                    });
                    this.updateSessionMap.set(uriString, { promise });
                }
            }
        }
        /** Event listener for configuration changes. */
        // const configurationDidChangeListener = (event: vscode.ConfigurationChangeEvent) => {
        // };

        interface QuickPickItemForDict extends vscode.QuickPickItem {
            scope: lang.DictParserResult['scope'];
            template?: 'empty' | 'workspaceSymbols' | undefined;
        }

        /**
         * Command handler for showing the content of dictionary as a virtual document in Markdown format.
         * This function simply tells the application to open a URI for the selected dictionary.
         * The content generation is delegated to the TextDocumentContentProvider (i.e. this controller).
         */
        const showDictionaryPreviewCommandHandler = async (..._args: any[]) => {
            const quickPickItems: QuickPickItemForDict[] = [
                { label: vscode.l10n.t('Extension'), kind: vscode.QuickPickItemKind.Separator, scope: 'extension' },
                { label: 'builtins', scope: 'extension' },
            ];
            const globalStateKeys = context.globalState.keys();
            if (globalStateKeys.length > 0) {
                quickPickItems.push({ label: vscode.l10n.t('User'), kind: vscode.QuickPickItemKind.Separator, scope: 'global' });
                globalStateKeys.forEach(key => quickPickItems.push({ label: key, scope: 'global' }));
            }
            const workspaceStateKeys = context.workspaceState.keys();
            if (workspaceStateKeys.length > 0) {
                quickPickItems.push({ label: vscode.l10n.t('Workspace'), kind: vscode.QuickPickItemKind.Separator, scope: 'workspace' });
                workspaceStateKeys.forEach(key => quickPickItems.push({ label: key, scope: 'workspace' }));
            }

            // Show quick pick to select a dictionary.
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: vscode.l10n.t('Select a dictionary to preview'),
            });
            if (!selectedItem) { return; } // Exit if the user cancels.

            // Create a URI for the selected dictionary and ask the application to open it.
            // For the extension to recognize the content as a markdown document, append ".md" suffix to the URI path.
            let uri: vscode.Uri | undefined;
            if (selectedItem.scope === 'extension') {
                if (selectedItem.label === 'builtins') {
                    uri = vscode.Uri.parse(BUILTIN_DICT_URI + '.md');
                }
            } else if (selectedItem.scope === 'global') {
                uri = vscode.Uri.parse(GLOBAL_DICT_BASEURI + '/' + selectedItem.label + '.md');
            } else if (selectedItem.scope === 'workspace') {
                uri = vscode.Uri.parse(WORKSPACE_DICT_BASEURI + '/' + selectedItem.label + '.md');
            }

            // If the URI is created successfully, open it with the preview mode according to the user setting.
            if (uri) {
                uri = uri.with({ query: 'dictionaryPreview' });

                type DictionaryPreviewOption = 'markdown' | 'preview' | 'markdown+preview';
                const option = vscode.workspace.getConfiguration('vscode-igorpro').get<DictionaryPreviewOption>('dictionaryPreview', 'preview');

                if (option === 'preview') {
                    // Show preview directly without showing the source markdown document.
                    // While not documented (AFAIK), the 'markdown.showPreview' command can accept a URI as an argument to specify which document to preview.
                    await vscode.commands.executeCommand('markdown.showPreview', uri);
                    return;
                } else if (option === 'markdown' || option === 'markdown+preview') {
                    // Show the source markdown document.
                    // If the option is 'markdown+preview', also show the preview.
                    await vscode.window.showTextDocument(uri, { preview: false });
                    if (option === 'markdown+preview') {
                        await vscode.commands.executeCommand('markdown.showPreview');
                    }
                }
            }
        };

        /**
         * Command handler for showing the content of dictionary in JSON format as a new document.
         */
        const showDictionarySourceCommandHandler = async (..._args: any[]) => {
            const quickPickItems: QuickPickItemForDict[] = [];
            const document = vscode.window.activeTextEditor?.document;

            quickPickItems.push({ label: vscode.l10n.t('User'), kind: vscode.QuickPickItemKind.Separator, scope: 'global' });
            context.globalState.keys().forEach(key => quickPickItems.push({ label: key, scope: 'global' }));
            quickPickItems.push({ label: '[global-empty]', description: vscode.l10n.t('new dictionary with empty content'), scope: 'global', template: 'empty' });
            if (document && vscode.languages.match(lang.SELECTOR, document)) {
                quickPickItems.push({ label: '[global-template]', description: vscode.l10n.t('new dictionary with symbols defined in procedure files'), scope: 'global', template: 'workspaceSymbols' });
            }

            quickPickItems.push({ label: vscode.l10n.t('Workspace'), kind: vscode.QuickPickItemKind.Separator, scope: 'workspace' });
            context.workspaceState.keys().forEach(key => quickPickItems.push({ label: key, scope: 'workspace' }));
            quickPickItems.push({ label: '[workspace-empty]', description: vscode.l10n.t('new dictionary with empty content'), scope: 'workspace', template: 'empty' });
            if (document && vscode.languages.match(lang.SELECTOR, document)) {
                quickPickItems.push({ label: '[workspace-template]', description: vscode.l10n.t('new dictionary with symbols defined in procedure files'), scope: 'workspace', template: 'workspaceSymbols' });
            }

            // Show quick pick to select a dictionary.
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: vscode.l10n.t('Select a dictionary to view or edit'),
            });
            if (!selectedItem) { return; } // Exit if the user cancels.

            // Fetch the dictionary from the global/workspace state or create a new dictionary.
            let obj: lang.CategorizedDictionary | undefined;
            if (selectedItem.template === undefined) {
                // Fetch the dictionary from the global/workspace state.
                obj = selectedItem.scope === 'global' ?
                    context.globalState.get(selectedItem.label) :
                    context.workspaceState.get(selectedItem.label);
            } else {
                // If the user selects a template with current workspace symbols, 
                // gather symbols from files in the workspace and put them in a dictionary.
                // Else, create an empty dictionary.
                const newRefBook = new Map<string, lang.ReferenceItem>();

                if (selectedItem.template === 'workspaceSymbols' && document) {
                    const sessions = await this.fileController?.getUpdateSessionIteable(document);
                    if (sessions) {
                        for (const [uriString, session] of sessions) {
                            // Local variables are not exported.
                            if (uriString === lang.ACTIVE_FILE_URI) { continue; }

                            // Skip files that are not parsed successfully.
                            const refBook = (await session.promise)?.refBook;
                            if (refBook === undefined) { continue; }

                            // [Igor Pro specific code]
                            // Copy entries from the reference book while filtering out static items.
                            // To avoids static items overwriting non-static items having the same identifier,
                            // the filtering should be done before merging.
                            for (const [identifier, item] of refBook.entries()) {
                                if (item.isStatic === true) { continue; }
                                newRefBook.set(identifier, item);
                            }
                        }
                    }
                }

                // Convert the map object into a categorized dictionary object.
                // [Igor Pro specific code]
                // While static entries are filtered out in the previous step, 
                // the 3rd argument of the function is set to `true` to remove
                // `isStatic` property from the reference items.
                const categoryFilter = ['constant', 'picture', 'structure', 'macro', 'function'] as const;
                obj = lang.convertToCategorizedDictionary({
                    $schema: this.extensionSchemaUriString, // this.externalSchemaUriString,
                    identifier: selectedItem.scope === 'global' ? 'globalDict' : 'workspaceDict',
                    scope: selectedItem.scope,
                    refBook: newRefBook,
                }, categoryFilter, true);
            }

            // Open a new text document with the content of the selected dictionary in JSON format.
            if (!obj) {
                vscode.window.showErrorMessage(vscode.l10n.t('Failed to load the dictionary content.'));
            } else {
                const content = JSON.stringify(obj, ((key, value) => key === 'location' ? undefined : value), 2);
                const document = await vscode.workspace.openTextDocument({ language: 'json', content: content });
                await vscode.window.showTextDocument(document);
                return;
            }
        };

        const registerDictionaryCommandHandler = async (..._args: any[]) => {
            // Check if text content of active editor is a valid JSON.
            const editor = vscode.window.activeTextEditor;
            let obj: lang.CategorizedDictionary | null | undefined;
            if (editor === undefined) {
                vscode.window.showErrorMessage(vscode.l10n.t('No active editor found.'));
                return;
            } else if (editor.document.languageId !== 'json') {
                vscode.window.showErrorMessage(vscode.l10n.t('Document content is not in JSON format.'));
                return;
            } else if (vscode.languages.getDiagnostics(editor.document.uri).length > 0) {
                vscode.window.showErrorMessage(vscode.l10n.t('Document has validation errors.'));
                return;
            }

            // Parse JSON and do minimal validation for required properties.
            try {
                obj = JSON.parse(editor.document.getText());
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(vscode.l10n.t('Failed to parse JSON. {0}', errorMessage));
                return;
            }

            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                vscode.window.showErrorMessage(vscode.l10n.t('Document content must be a JSON object (not array or null).'));
                return;
            } else if ((/\/(.+\.)?ipdict\.json$/.test(editor.document.uri.path)) === false && (!('$schema' in obj) || typeof obj.$schema !== 'string')) {
                // The JSON file must be validated by the JSON schema.
                // If the filename of the JSON file ends with 'ipdict.json', the JSON schema validation is automatically applied by VS Code.
                // Otherwise, the extension requires the user to explicitly include the $schema property in the JSON content.
                vscode.window.showErrorMessage(vscode.l10n.t('JSON object is not validated by the JSON schema.'));
                return;
            } else if (!('kind' in obj) || obj.kind !== 'igorpro.dictionary') {
                vscode.window.showErrorMessage(vscode.l10n.t('JSON object must have the "{0}" value for the "{1}" key.', 'igorpro.dictionary', 'kind'));
                return;
            } else if (!('identifier' in obj) || typeof obj.identifier !== 'string') {
                vscode.window.showErrorMessage(vscode.l10n.t('JSON object must have a value of {0} type for the "{1}" key.', 'string', 'identifier'));
                return;
            } else if (!('scope' in obj) || typeof obj.scope !== 'string') {
                vscode.window.showErrorMessage(vscode.l10n.t('JSON object must have a value of {0} type for the "{1}" key.', 'string', 'scope'));
                return;
            } else if (obj.scope !== 'global' && obj.scope !== 'workspace') {
                vscode.window.showErrorMessage(vscode.l10n.t('Only "global" and "workspace" are the allowed values for the "scope" key.'));
                return;
            } else if (!('categories' in obj) || obj.categories !== null && typeof obj.categories !== 'object' || Array.isArray(obj.categories)) {
                vscode.window.showErrorMessage(vscode.l10n.t('JSON object must have a value of {0} type for the "{1}" key.', 'object', 'categories'));
                return;
            }

            let storageLabel: string;
            let uriString: string;
            let memento: vscode.Memento;
            if (obj.scope === 'global') {
                storageLabel = vscode.l10n.t('User');
                uriString = GLOBAL_DICT_BASEURI + '/' + obj.identifier;
                memento = context.globalState;
            } else {
                // if (obj.scope === 'workspace')
                storageLabel = vscode.l10n.t('Workspace');
                uriString = WORKSPACE_DICT_BASEURI + '/' + obj.identifier;
                memento = context.workspaceState;
            }

            const isNew = !(memento.keys().includes(obj.identifier));
            const flag = isNew ?
                vscode.l10n.t('OK') :
                await vscode.window.showWarningMessage<string>(
                    vscode.l10n.t('Are you sure you want to update the dictionary "{0}" in {1} storage with the current editor content?', obj.identifier, storageLabel),
                    { modal: true, detail: vscode.l10n.t('This action cannot be undone.') },
                    vscode.l10n.t('OK'));

            if (flag === vscode.l10n.t('OK')) {
                try {
                    const dictParserResult = lang.convertFromCategorizedDictionary(obj);
                    this.updateSessionMap.set(uriString, { promise: Promise.resolve(dictParserResult) });

                    // [Igor Pro specific code]
                    // Extract operation identifiers and store them for later use in the file controller.
                    if (obj.categories.operation) {
                        this.externalOperationMap.set(uriString, Object.keys(obj.categories.operation));
                    } else {
                        this.externalOperationMap.set(uriString, []);
                    }

                    if (isNew) {
                        vscode.window.showInformationMessage(vscode.l10n.t('Dictionary "{0}" has been created in {1} storage.', obj.identifier, storageLabel));
                    } else {
                        vscode.window.showInformationMessage(vscode.l10n.t('Dictionary "{0}" in {1} storage has been updated.', obj.identifier, storageLabel));
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(vscode.l10n.t('Failed to convert dictionary. {0}', errorMessage));
                    return;
                }
                memento.update(obj.identifier, obj);
                // if (obj.scope === 'global') {
                //     context.globalState.setKeysForSync(context.globalState.keys().filter(key => key.endsWith('Sync')));
                // }
            }
        };

        const deleteDictionaryCommandHandler = async (_args: any[]) => {
            const quickPickItems: QuickPickItemForDict[] = [];
            const globalStateKeys = context.globalState.keys();
            if (globalStateKeys.length > 0) {
                quickPickItems.push({ label: vscode.l10n.t('User'), kind: vscode.QuickPickItemKind.Separator, scope: 'global' });
                globalStateKeys.forEach(key => quickPickItems.push({ label: key, scope: 'global' }));
            }
            const workspaceStateKeys = context.workspaceState.keys();
            if (workspaceStateKeys.length > 0) {
                quickPickItems.push({ label: vscode.l10n.t('Workspace'), kind: vscode.QuickPickItemKind.Separator, scope: 'workspace' });
                workspaceStateKeys.forEach(key => quickPickItems.push({ label: key, scope: 'workspace' }));
            }

            const quickPickOptions: vscode.QuickPickOptions = {
                placeHolder: vscode.l10n.t('Select a dictionary to delete'),
            };

            // If no dictionaries are registered, show a message and exit.
            if (quickPickItems.length === 0) {
                vscode.window.showQuickPick([vscode.l10n.t('{0} No dictionaries to delete.', '$(extensions-info-message)')], quickPickOptions);
                return;
            }

            // Else, show quick pick to select a dictionary to delete.
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, quickPickOptions);
            if (!selectedItem) { return; } // Exit if the user cancels.

            const flag = await vscode.window.showWarningMessage(
                vscode.l10n.t('Are you sure you want to delete the dictionary "{0}"?', selectedItem.label),
                { modal: true, detail: vscode.l10n.t('This action cannot be undone.') },
                vscode.l10n.t('OK')
            );
            if (flag === vscode.l10n.t('OK')) {
                let uriString: string;
                let memento: vscode.Memento;
                if (selectedItem.scope === 'global') {
                    uriString = GLOBAL_DICT_BASEURI + '/' + selectedItem.label;
                    memento = context.globalState;
                } else if (selectedItem.scope === 'workspace') {
                    uriString = WORKSPACE_DICT_BASEURI + '/' + selectedItem.label;
                    memento = context.workspaceState;
                } else {
                    vscode.window.showErrorMessage(vscode.l10n.t('Invalid scope.'));
                    return;
                }
                memento.update(selectedItem.label, undefined);
                this.updateSessionMap.delete(uriString);
                // [Igor Pro specific code]
                // Delete stored operation identifiers.
                this.externalOperationMap.delete(uriString);
            }
        };

        // Register command and event handlers.
        context.subscriptions.push(
            // Register command handlers.
            vscode.commands.registerCommand('vscode-igorpro.showDictionaryPreview', showDictionaryPreviewCommandHandler),
            vscode.commands.registerCommand('vscode-igorpro.showDictionarySource', showDictionarySourceCommandHandler),
            vscode.commands.registerCommand('vscode-igorpro.registerDictionary', registerDictionaryCommandHandler),
            vscode.commands.registerCommand('vscode-igorpro.deleteDictionary', deleteDictionaryCommandHandler),
            // Register providers.
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),
            // Register event handlers.
            // vscode.workspace.onDidChangeConfiguration(configurationDidChangeListener),
        );
    }

    private async loadExtensionDictionary(fileUri: vscode.Uri) {

        try {
            const uint8Array = await vscode.workspace.fs.readFile(fileUri);
            const decodedString = await vscode.workspace.decode(uint8Array, { encoding: 'utf8' });
            const dictionary: lang.CategorizedDictionary = JSON.parse(decodedString);

            for (const [uriString, categoryFilter] of extensionDictionaryEntries) {
                const parserResult = lang.convertFromCategorizedDictionary(dictionary, categoryFilter);
                this.updateSessionMap.set(uriString, { promise: Promise.resolve(parserResult) });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const message = vscode.l10n.t('Failed to load dictionary for built-in symbols. {0}', errorMessage);

            // Do not return a thenable object chained to `showErrorMessage()` so 
            // that the return value of the function is resolved before the user
            // takes an action against the dialog.
            vscode.window.showErrorMessage(message);
            return undefined;
        }
    }

    // Override the method in the base class to provide custom descriptions for completion items.
    // For entries in a built-in or user-defined dictionary, it returns a descriptive label.
    protected override getCompletionItemLabelDescription(uriString: string): string | undefined {
        if (uriString === BUILTIN_DICT_URI || uriString === OPERATION_DICT_URI || uriString === EXTRA_DICT_URI) {
            return 'built-in';
        } else if (uriString.startsWith(GLOBAL_DICT_BASEURI)) {
            return 'global/' + uriString.substring(GLOBAL_DICT_BASEURI.length + 1);
        } else if (uriString.startsWith(WORKSPACE_DICT_BASEURI)) {
            return 'workspace/' + uriString.substring(WORKSPACE_DICT_BASEURI.length + 1);
        } else {
            return undefined;
        }
    }

    // Override the method in the base class to provide short text on hover and resolved completion items.
    protected override getSignatureComment(categoryLabel: string, uriString: string): string {
        if (uriString === BUILTIN_DICT_URI || uriString === OPERATION_DICT_URI || uriString === EXTRA_DICT_URI) {
            return 'built-in ' + categoryLabel;
        } else if (uriString.startsWith(GLOBAL_DICT_BASEURI)) {
            return `${categoryLabel} in global/${uriString.substring(GLOBAL_DICT_BASEURI.length + 1)}`;
        } else if (uriString.startsWith(WORKSPACE_DICT_BASEURI)) {
            return `${categoryLabel} in workspace/${uriString.substring(WORKSPACE_DICT_BASEURI.length + 1)}`;
        } else {
            return categoryLabel;
        }
    }

    // Required implementation of vscode.TextDocumentContentProvider.
    public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string | undefined> {
        /** Helper function to format a reference item as Markdown. */
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

        if (token.isCancellationRequested) { return undefined; }

        // The URI must have the following format: 'igorpro://{extension|global|workspace}/{identifier}.md?dictionaryPreview'
        if (uri.scheme !== 'igorpro' || uri.query !== 'dictionaryPreview' || !uri.path.endsWith('.md')) {
            return undefined;
        }

        // Create a URI string for the dictionary by removing the '.md' suffix and query part from the URI,
        let uriString = uri.with({ query: '' }).toString(); // Remove the query part.
        uriString = uriString.substring(0, uriString.length - 3); // Remove '.md' suffix.

        if (uriString !== BUILTIN_DICT_URI && !uriString.startsWith(GLOBAL_DICT_BASEURI) && !uriString.startsWith(WORKSPACE_DICT_BASEURI)) {
            return undefined;
        }

        // Check if the parser result for the URI is available.
        const parserResult = await this.updateSessionMap.get(uriString)?.promise;
        if (!parserResult) { return undefined; }

        // Convert the parser result into a categorized dictionary and generate Markdown text for the preview.
        const dictionary = lang.convertToCategorizedDictionary(parserResult);

        // [Igor Pro specific code]
        // Built-in dictionary is split into multiple Map objects to avoid
        // overwriting entries with the same identifier across different categories.
        // Merge them back into a single dictionary for the preview.
        if (uriString === BUILTIN_DICT_URI) {
            const additionalParserResults = [
                await this.updateSessionMap.get(OPERATION_DICT_URI)?.promise,
                await this.updateSessionMap.get(EXTRA_DICT_URI)?.promise
            ];
            for (const additionalParserResult of additionalParserResults) {
                if (additionalParserResult) {
                    const additionalDictionary = lang.convertToCategorizedDictionary(additionalParserResult);
                    for (const [category, entries] of Object.entries(additionalDictionary.categories)) {
                        if (category in dictionary.categories) {
                            Object.assign(dictionary.categories[category], entries);
                            // dictionary.categories[category] = { ...dictionary.categories[category], ...entries };
                        } else {
                            dictionary.categories[category as keyof lang.CategorizedDictionary['categories']] = entries;
                        }
                    }
                }
            }
        }

        // Add heading for the dictionary.
        let mdText = `# ${dictionary.name ?? dictionary.identifier} (${dictionary.scope})\n\n`;
        if (dictionary.description) {
            mdText += `${dictionary.description}\n\n`;
        }

        // Add Table of Contents.
        mdText += `## Table of Contents\n\n`;
        for (const [categoryName, entriesInCategory] of Object.entries(dictionary.categories)) {
            if (Object.keys(entriesInCategory).length === 0) { continue; }
            const categoryLabel = lang.getLabelForCategory(categoryName as keyof typeof dictionary.categories);
            mdText += `- [${categoryLabel}](#${categoryLabel.toLowerCase().replace(/\s+/g, '-')} )\n`;
        }

        // Add each category and its items.
        for (const [categoryName, entriesInCategory] of Object.entries(dictionary.categories)) {
            // Add heading for each category.
            if (Object.keys(entriesInCategory).length === 0) { continue; }
            mdText += `## ${lang.getLabelForCategory(categoryName as keyof typeof dictionary.categories)}\n\n`;

            // Add each item.
            for (const [identifier, entry] of Object.entries(entriesInCategory)) {
                // [Igor Pro specific code]
                // The identifier is lowercased for simplicity in looking up
                // from the database. For readability, use the original case
                // for the part of the signature that matches the identifier.
                mdText += entry.signature.toLowerCase().startsWith(identifier) ?
                    `### ${entry.signature.substring(0, identifier.length)}\n\n` :
                    `### ${identifier}\n\n`;
                mdText += getFormattedStringForItem(entry);
            }
        }
        return mdText;
    }
}
