import * as vscode from 'vscode';
import * as lang from './language';
import { Controller } from './controller';
import { SyntaxError, parse } from './parser';
import { traverseForGlobals, traverseForLocals } from './traverser';
import type * as tree from './tree';

import { uriFromIgorInclude, includeCodeForIpfFileUri } from './path';


type DocumentUpdateQuery = { type: 'Document', document: vscode.TextDocument };
type FileUpdateQuery = { type: 'File', uri: vscode.Uri };

class IgorproDocumentLink extends vscode.DocumentLink {
    public readonly path: string;
    public readonly systemInclude: boolean;
    public readonly baseUri: vscode.Uri;
    constructor(arg: lang.IncludeArgument, baseUri: vscode.Uri) {
        super(arg.range, undefined);
        this.path = arg.path;
        this.systemInclude = arg.system;
        this.baseUri = baseUri;
    }
}

type SuggestScopeConfig = 'workspace' | 'openDocuments' | 'activeEditor';

/**
 * Get a set of the URIs of supported files from workspaces.
 * 
 * @returns Thenable that resolves to a set of URI strings.
 */
async function findFilesInWorkspaces() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const uriStringSet = new Set<string>();

    if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
            // Refer to `files.associations` configuration property.
            const associations = Object.assign(
                <Record<string, string>>{ '*.ipf': 'igorpro' },
                vscode.workspace.getConfiguration('files', workspaceFolder).get<Record<string, string>>('associations')
            );

            for (const [key, value] of Object.entries(associations)) {
                const inclusivePattern = new vscode.RelativePattern(workspaceFolder, (key.includes('/') ? key : `**/${key}`));
                if (value === 'igorpro') {
                    for (const uri of await vscode.workspace.findFiles(inclusivePattern)) {
                        uriStringSet.add(uri.toString());
                    }
                } else {
                    for (const uri of await vscode.workspace.findFiles(inclusivePattern)) {
                        uriStringSet.delete(uri.toString());
                    }
                }
            }
        }
    }
    return uriStringSet;
}

/**
 * A controller subclass that handles files and documents in the current workspace.
 */
export class FileController extends Controller<lang.FileUpdateSession> implements vscode.DefinitionProvider, vscode.DocumentSymbolProvider, vscode.WorkspaceSymbolProvider, vscode.DocumentLinkProvider<IgorproDocumentLink>, vscode.DocumentDropEditProvider, vscode.TextDocumentContentProvider {

    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    public externalOperationMap: Map<string, string[]>;

    constructor(context: vscode.ExtensionContext, externalOperationMap: Map<string, string[]>) {
        super(context);

        this.externalOperationMap = externalOperationMap;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('igorpro');

        const inspectSyntaxTreeCommandHandler = async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'igorpro') {
                const uri = vscode.Uri.parse(lang.AST_URI).with({
                    query: editor.document.uri.toString(),
                    fragment: editor.document.version.toString()
                });
                vscode.window.showTextDocument(uri, { preview: false });
            }
        };

        /**  Event handler invoked when the document is changed. */
        const textDocumentDidChangeListener = (event: vscode.TextDocumentChangeEvent) => {
            const document = event.document;
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.runUpdateSessions([{ type: 'Document', document }]);
            }
        };

        /**
         * Event handler invoked when the document is opened.
         * It is also invoked after the user manually changed the language identifier.
         */
        const textDocumentDidOpenListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.runUpdateSessions([{ type: 'Document', document }]);
            }
        };

        /** Event handler invoked when the document is saved. */
        const textDocumentDidSaveListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.runUpdateSessions([{ type: 'Document', document }]);
            }
        };

        /**
         * Event handler invoked when the document is closed.
         * It is also invoked after the user manually changed the language identifier.
         */
        const textDocumentDidCloseListener = async (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document)) {
                const uriString = document.uri.toString();

                this.diagnosticCollection.delete(document.uri);

                // Check whether the file is in a workspace folder.
                const filesInWorkspaces = await findFilesInWorkspaces();
                if (filesInWorkspaces.has(uriString)) {
                    // If file also exists in a workspace folder, delete tree and symbols.
                    const parserResult = await this.updateSessionMap.get(uriString)?.promise;
                    if (parserResult) {
                        parserResult.tree = undefined;
                        parserResult.symbols = undefined;
                    }
                } else {
                    this.updateSessionMap.delete(uriString);
                }
            }
        };

        // const activeTextEditorDidChangeListener = (editor: vscode.TextEditor | undefined) => { };

        // const fileDidCreateListener = async (event: vscode.FileCreateEvent) => { };

        /** Event handler invoked after files are renamed. */
        const fileDidRenameListener = async (event: vscode.FileRenameEvent) => {
            const filesInWorkspaces = await findFilesInWorkspaces();
            let oldUriStrings: string[] | undefined;
            let newUriStrings: string[] | undefined;

            for (const { oldUri, newUri } of event.files) {
                const stat = await vscode.workspace.fs.stat(newUri);
                if (stat.type === vscode.FileType.File) {
                    oldUriStrings = [oldUri.toString()];
                    if (filesInWorkspaces.has(newUri.toString())) {
                        newUriStrings = [newUri.toString()];
                    }
                } else if (stat.type === vscode.FileType.Directory) {
                    const oldDir = oldUri.toString() + '/';
                    oldUriStrings = [...this.updateSessionMap.keys()].filter(uriString => uriString.startsWith(oldDir));
                    const newDir = newUri.toString() + '/';
                    newUriStrings = [...filesInWorkspaces].filter(uriString => uriString.startsWith(newDir));
                }
            }

            this.reflectFileOperationInCollections(oldUriStrings, newUriStrings);
        };

        /** Event handler invoked before files are deleted. */
        const fileWillDeleteListener = async (event: vscode.FileWillDeleteEvent) => {
            for (const oldUri of event.files) {
                const promise = vscode.workspace.fs.stat(oldUri).then(
                    stat => {
                        let oldUriStrings: string[] | undefined;
                        if (stat.type === vscode.FileType.File) {
                            oldUriStrings = [oldUri.toString()];
                        } else if (stat.type === vscode.FileType.Directory) {
                            const oldDir = oldUri.toString() + '/';
                            oldUriStrings = [...this.updateSessionMap.keys()].filter(uriString => uriString.startsWith(oldDir));
                        }
                        this.reflectFileOperationInCollections(oldUriStrings);
                    }
                );
                event.waitUntil(promise);
            }
        };

        /** Event handler invoked when the configuration is changed. */
        const configurationDidChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (
                event.affectsConfiguration('files.associations') ||
                event.affectsConfiguration('files.encoding')
            ) {
                this.refreshCollections();
            }
        };

        /** Event handler invoked when the workspace folders are changed. */
        const workspaceFoldersDidChangeListener = (event: vscode.WorkspaceFoldersChangeEvent) => {
            this.refreshCollections();
        };

        // Asynchronously scan files and refresh the collection.
        this.refreshCollections();

        // Register providers and event handlers.
        context.subscriptions.push(
            // Register command handlers.
            vscode.commands.registerCommand('vscode-igorpro.inspectSyntaxTree', inspectSyntaxTreeCommandHandler),

            // Register document-event listeners.
            vscode.workspace.onDidChangeTextDocument(textDocumentDidChangeListener),
            vscode.workspace.onDidOpenTextDocument(textDocumentDidOpenListener),
            vscode.workspace.onDidSaveTextDocument(textDocumentDidSaveListener),
            vscode.workspace.onDidCloseTextDocument(textDocumentDidCloseListener),
            // vscode.window.onDidChangeActiveTextEditor(activeTextEditorDidChangeListener),

            // Register file-event listeners.
            // vscode.workspace.onDidCreateFiles(fileDidCreateListener),
            vscode.workspace.onDidRenameFiles(fileDidRenameListener),
            vscode.workspace.onWillDeleteFiles(fileWillDeleteListener),

            // Register other event listeners.
            vscode.workspace.onDidChangeConfiguration(configurationDidChangeListener),
            vscode.workspace.onDidChangeWorkspaceFolders(workspaceFoldersDidChangeListener),

            // Register providers.
            vscode.languages.registerDefinitionProvider(lang.SELECTOR, this),
            vscode.languages.registerDocumentSymbolProvider(lang.SELECTOR, this),
            vscode.languages.registerWorkspaceSymbolProvider(this),
            vscode.languages.registerDocumentLinkProvider(lang.SELECTOR, this),
            vscode.languages.registerDocumentDropEditProvider(lang.SELECTOR, this),
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),

            // Register diagnostic collection.
            this.diagnosticCollection,
        );
    }

    /**
     * Update the database.
     * @param oldUriStrings An iterable collection of file URIs of which metadata will be removed. Mismatched files are just ignored.
     * @param newUriStrings An iterable collection of file URIs of which metadata will be created. The file paths should be filtered beforehand.
     */
    private reflectFileOperationInCollections(oldUriStrings?: Iterable<string>, newUriStrings?: Iterable<string>) {
        // Clear data for old URIs.
        if (oldUriStrings) {
            for (const oldUriString of oldUriStrings) {
                this.updateSessionMap.delete(oldUriString);
                this.diagnosticCollection.delete(vscode.Uri.parse(oldUriString));
            }
        }

        // Parse files and store reference information for new URIs.
        // Do nothing for opened document files because they are handled by
        // `onDidOpenTextDocument` and `onDidCloseTextDocument` events.
        if (newUriStrings) {
            this.runMultipleUpdateSessions(newUriStrings, false);
        }
    }

    /**
     * Refresh the database by scanning files open in editor and other files in workspace folders.
     */
    private async refreshCollections() {
        // Clear data.
        this.updateSessionMap.clear();
        this.diagnosticCollection.clear();

        // Parse documents opened by editors.
        return this.runMultipleUpdateSessions(await findFilesInWorkspaces(), true);
    }

    /**
     * Subroutine that collects information for code navigation/editing.
     * Cancellation token is integrated.
     */
    private async runUpdateSessions(queries: (FileUpdateQuery | DocumentUpdateQuery)[]) {
        // Run workspace-independent analysis (IOW, analysis that does not use symbols defined in other files).
        for (const query of queries) {
            let uri: vscode.Uri;
            if (query.type === 'Document') {
                uri = query.document.uri;
            } else {
                uri = query.uri;
            }
            const uriString = uri.toString();

            // If the previous session is still runnning, cancel it.
            this.updateSessionMap.get(uriString)?.tokenSource?.cancel();

            // Create a new update session and start to analyze.
            const tokenSource = new vscode.CancellationTokenSource();
            const operationIdentifiers = [...this.externalOperationMap.values()].flat();
            const promise: Promise<lang.FileParserResult | undefined> = (query.type === 'Document') ?
                Promise.resolve().then(() => analyzeDocumentContent(query.document.getText(), true, true, operationIdentifiers, tokenSource.token)) :
                analyzeContentOfUri(query.uri, false, false, operationIdentifiers, tokenSource.token);
            const session: lang.FileUpdateSession = { promise, tokenSource };
            // Attach a callback that will clean the cancellation token when update is finished.
            session.promise.then(parserResult => {
                if (parserResult?.diagnostics) {
                    this.diagnosticCollection.set(uri, parserResult.diagnostics);
                } else {
                    this.diagnosticCollection.delete(uri);
                }
            }).finally(() => {
                tokenSource.dispose();
                session.tokenSource = undefined;
            });
            this.updateSessionMap.set(uriString, session);
        }
    }

    /**
     * Subroutine to parse the contents of multiple files specified by URIs.
     */
    private runMultipleUpdateSessions(targetUriStrings: Iterable<string>, includeFilesInEditor: boolean) {
        const uriStringsNotInEditor: string[] = [...targetUriStrings];
        const queries: (FileUpdateQuery | DocumentUpdateQuery)[] = [];

        for (const document of vscode.workspace.textDocuments) {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                const index = uriStringsNotInEditor.indexOf(document.uri.toString());
                if (index !== -1) {
                    if (includeFilesInEditor) {
                        queries.push({ type: 'Document', document });
                    }
                    uriStringsNotInEditor.splice(index, 1);
                }
            }
        }

        for (const uriString of uriStringsNotInEditor) {
            const uri = vscode.Uri.parse(uriString);
            queries.push({ type: 'File', uri });
        }

        return this.runUpdateSessions(queries);
    }

    /**
     * Asynchronously update position-sensitive local symbol database.
     * @param document Text Document
     * @param position Position
     * @returns Thenable that resolves to a session container that contains parsed data.
     */
    private runLocalUpdateSession(document: vscode.TextDocument, position: vscode.Position) {
        // Update the database for local variables for the current cursor position.
        const session = this.updateSessionMap.get(document.uri.toString());
        if (session) {
            const promise = session.promise.then(
                parserResult => {
                    if (parserResult?.tree) {
                        return { refBook: traverseForLocals(parserResult.tree, position), includes: [] };
                    };
                }
            );
            this.updateSessionMap.set(lang.ACTIVE_FILE_URI, { promise, tokenSource: undefined });
            return promise;
        } else {
            this.updateSessionMap.delete(lang.ACTIVE_FILE_URI);
            return undefined;
        }
    }

    /**
     * Filter parser sessions.
     * If `vscode-igorpro.suggest.scope` setting is not `"workspace"`,
     * URIs not pointing to existent files defined in `#include` chains are filtered.
     * @param document Root document of `#include` chains (used when `vscode-igorpro.suggest.scope` setting is set to `"activeEditor"`)
     * @returns A promise of iterable of filtered parser sessions.
     */
    public override async getUpdateSessionIteable(document: vscode.TextDocument): Promise<Iterable<[string, lang.FileUpdateSession]>> {
        const scope = vscode.workspace.getConfiguration('vscode-igorpro.suggest', document).get<SuggestScopeConfig>('scope', 'workspace');

        /**
         * Subroutine to recursivley add URIs of existent files declared in `#include` statements into a set object.
         * into a specified set.
         * @param documentUri 
         * @param uriStringSet 
         * @returns 
         */
        const findIncludedFileUris = async (documentUri: vscode.Uri, uriStringSet: Set<string>) => {
            const documentUriString = documentUri.toString();
            if (!uriStringSet.has(documentUriString)) {
                uriStringSet.add(documentUriString);

                const includes = (await this.updateSessionMap.get(documentUri.toString())?.promise)?.includes;
                if (!includes) { return; }

                const baseUri = vscode.Uri.joinPath(documentUri, '..');
                const urisIfExist = await Promise.all(includes.map(include => uriFromIgorInclude(include.path, include.system, this.igorVersion.major, baseUri)));
                for (const uriIfExist of urisIfExist) {
                    if (!uriIfExist) { continue; }
                    await findIncludedFileUris(uriIfExist, uriStringSet);
                }
                return;
            } else {
                return;
            }
        };

        if (scope === 'workspace') {
            return this.updateSessionMap;
        } else if (scope === 'openDocuments') {
            const includedFileSet: Set<string> = new Set([lang.ACTIVE_FILE_URI]);
            const documents = vscode.workspace.textDocuments.filter(document => vscode.languages.match(lang.SELECTOR, document));
            for (const document of documents) {
                await findIncludedFileUris(document.uri, includedFileSet);
            }
            return [...this.updateSessionMap].filter(([uriString, _session]) => includedFileSet.has(uriString));
        } else { // if (scope === 'activeEditor')
            const includedFileSet: Set<string> = new Set([lang.ACTIVE_FILE_URI]);
            await findIncludedFileUris(document.uri, includedFileSet);
            return [...this.updateSessionMap].filter(([uriString, _session]) => includedFileSet.has(uriString));
        }
    }

    // Override the method in the base class to provide custom descriptions for completion items.
    // For symbols defined in a file in the workspace, it returns the relative path.
    protected override getCompletionItemLabelDescription(uriString: string): string | undefined {
        if (uriString === lang.ACTIVE_FILE_URI) {
            return 'local';
        } else {
            return vscode.workspace.asRelativePath(vscode.Uri.parse(uriString));
        }
    }

    // Override the method in the base class to provide short text on hover and resolved completion items.
    protected override getSignatureComment(categoryLabel: string, _uriString: string): string {
        return `user-defined ${categoryLabel}`;
    }

    // Required implementation of vscode.CompletionItemProvider, overriding the super class.
    public override async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionList<lang.CompletionItem> | lang.CompletionItem[] | undefined> {
        if (token.isCancellationRequested) { return; }

        // Update the database for local variables for the current cursor position.
        this.runLocalUpdateSession(document, position);

        return super.provideCompletionItems(document, position, token, context);
    }

    // Required implementation of vscode.HoverProvider, overriding the super class.
    public override async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        if (token.isCancellationRequested) { return; }

        // Update the database for local variables for the current cursor position.
        this.runLocalUpdateSession(document, position);

        return super.provideHover(document, position, token);
    }

    // Required implementation of vscode.DefinitionProvider.
    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.DefinitionLink[] | undefined> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // Update the database for local variables for the current cursor position.
        this.runLocalUpdateSession(document, position);

        // Seek the identifier.
        const locations: vscode.Location[] = [];
        const parserSessionIterable = await this.getUpdateSessionIteable(document);
        if (token.isCancellationRequested) { return; }

        for (const [uriString, session] of parserSessionIterable) {
            const uri = (uriString === lang.ACTIVE_FILE_URI) ? document.uri : vscode.Uri.parse(uriString);

            // Scan all types of symbols in the database of the respective files.
            const refItem = (await session.promise)?.refBook.get(selectorName);
            if (token.isCancellationRequested) { return; }
            // Static symbols in another file are not used.
            if (refItem && refItem.location && !(refItem.isStatic && uriString !== document.uri.toString())) {
                locations.push(new vscode.Location(uri, lang.convertRange(refItem.location)));
            }
        }
        return locations;
    }

    // Required implementation of `vscode.DocumentSymbolProvider`.
    public async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[] | undefined> {
        if (token.isCancellationRequested) { return; }

        return (await this.updateSessionMap.get(document.uri.toString())?.promise)?.symbols;
    }

    // Required implementation of `vscode.WorkspaceSymbolProvider`.
    // This function looks for all symbol definitions that matched with `query` from the workspace.
    public async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | undefined> {
        if (token.isCancellationRequested) { return; }

        // Quit when the query is not empty and contains characters not allowed in an identifier.
        if (!/^[a-zA-Z0-9_]*$/.test(query)) { return; }

        // Create a regular expression that filters symbols from `query`.
        // e.g., 'abc' => /a.*b.*c/i
        // const regExp = new RegExp(query.replace(/(?=[_A-Z])/g, '.*'), 'i');
        const regExp = new RegExp(query.split('').join('.*'), 'i');

        // seek the identifier
        const symbols: vscode.SymbolInformation[] = [];
        for (const [uriString, session] of this.updateSessionMap.entries()) {
            // Skip storage for local variables.
            if (uriString === lang.ACTIVE_FILE_URI) { continue; }

            const uri = vscode.Uri.parse(uriString);
            const refBook = (await session.promise)?.refBook;

            // Quit if cancelled and skip if symbol is not found in the file.
            if (token.isCancellationRequested) { return; }
            if (refBook === undefined) { continue; }

            // Find all items from each storage.
            for (const [identifier, refItem] of refBook.entries()) {
                if ((query.length === 0 || regExp.test(identifier)) && refItem.location) {
                    const name = (refItem.category === 'function') ? identifier + '()' : identifier;
                    const location = new vscode.Location(uri, lang.convertRange(refItem.location));
                    const symbolKind = lang.getSymbolKindForCategory(refItem.category);
                    symbols.push(new vscode.SymbolInformation(name, symbolKind, '', location));
                }
            }
        }
        return symbols;
    }

    // Required implementation of `vscode.DocumentLinkProvider`.
    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<IgorproDocumentLink[] | undefined> {
        if (token.isCancellationRequested) { return; }

        const baseUri = vscode.Uri.joinPath(document.uri, '..');
        const includes = (await this.updateSessionMap.get(document.uri.toString())?.promise)?.includes;

        if (token.isCancellationRequested) { return; }
        return includes?.map(arg => new IgorproDocumentLink(arg, baseUri));
    }

    // Optional implementation of `vscode.DocumentLinkProvider`.
    public async resolveDocumentLink(link: IgorproDocumentLink, token: vscode.CancellationToken): Promise<IgorproDocumentLink | undefined> {
        if (token.isCancellationRequested) { return; }

        link.target = await uriFromIgorInclude(link.path, link.systemInclude, this.igorVersion.major, link.baseUri);;
        return link;
    }

    // Required implementation of `vscode.DocumentDropEditProvider`.
    // This function is called when a file is dropped into the editor.
    // This function returns a path string like `#include "..."`.
    public provideDocumentDropEdits(document: vscode.TextDocument, _position: vscode.Position, dataTransfer: vscode.DataTransfer, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentDropEdit> {
        // The value for 'text/uri-list' key in dataTransfer is a string of file list separated by '\r\n'.
        const uriList = dataTransfer.get('text/uri-list');
        if (uriList && typeof uriList.value === 'string') {
            const ipfFileUris = uriList.value.split('\r\n').map(uriString => vscode.Uri.parse(uriString));
            const includeCodes = ipfFileUris.map(
                ipfFileUri => includeCodeForIpfFileUri(ipfFileUri, this.igorVersion.major, document.uri)
            ).filter(code => code !== undefined);
            if (includeCodes.length > 0) {
                return new vscode.DocumentDropEdit(includeCodes.join(''));
            }
        }
        return undefined;
    }

    // required implementation of vscode.TextDocumentContentProvider.
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        if (token.isCancellationRequested) { return; }

        if (lang.AST_URI === uri.with({ query: '', fragment: '' }).toString()) {
            const docUri = vscode.Uri.parse(uri.query);
            const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === docUri.toString());
            if (editor) {
                try {
                    const operationIdentifiers = [...this.externalOperationMap.values()].flat();
                    const tree = parse(editor.document.getText(), { operationIdentifiers });
                    // const content = JSON.stringify(tree, null, 2);
                    return JSON.stringify(tree, (key, value) => { return key === 'loc' ? undefined : value; }, 2);
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        vscode.window.showErrorMessage(vscode.l10n.t('Syntax error in parsing: {0}', error.message));
                    } else if (error instanceof Error) {
                        vscode.window.showErrorMessage(vscode.l10n.t('Error in parsing: {0}', error.message));
                    } else {
                        vscode.window.showErrorMessage(vscode.l10n.t('Unknown error in parsing: {0}', String(error)));
                    }
                }
            }
        }
    }
}

async function analyzeContentOfUri(uri: vscode.Uri, diagnose: boolean, isInEditor: boolean, operationIdentifiers: string[], token: vscode.CancellationToken): Promise<lang.FileParserResult | undefined> {
    const uint8Array = await vscode.workspace.fs.readFile(uri);
    const content = await vscode.workspace.decode(uint8Array, { uri });
    return analyzeDocumentContent(content, diagnose, isInEditor, operationIdentifiers, token);
}

function analyzeDocumentContent(content: string, diagnose: boolean, isInEditor: boolean, operationIdentifiers: string[], token: vscode.CancellationToken): lang.FileParserResult | undefined {
    // private parseDocumentContents(contents: string, uri: vscode.Uri, isOpenDocument: boolean, diagnoseProblems: boolean) {
    if (token.isCancellationRequested) { return undefined; }

    let tree: tree.Program;
    let diagnostics: vscode.Diagnostic[] | undefined;
    try {
        tree = parse(content, { operationIdentifiers });
    } catch (error) {
        if (diagnose) {
            if (error instanceof SyntaxError) {
                diagnostics = [new vscode.Diagnostic(lang.convertRange(error.location), vscode.l10n.t('Syntax error in parsing: {0}', error.message))];
            } else if (error instanceof Error) {
                diagnostics = [new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), vscode.l10n.t('Error in parsing: {0}', error.message))];
            } else {
                diagnostics = [new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), vscode.l10n.t('Unknown error in parsing: {0}', String(error)))];
            }
        }
        return { refBook: new Map(), includes: [], diagnostics };
    }

    if (token.isCancellationRequested) { return undefined; }

    if (diagnose) {
        diagnostics = tree.problems.map(
            problem => new vscode.Diagnostic(lang.convertRange(problem.loc), problem.message, problem.severity)
        );
    }

    const { refBook, includes, symbols } = traverseForGlobals(tree);

    if (isInEditor) {
        return { refBook, includes, tree, symbols, diagnostics };
    } else {
        return { refBook, includes, diagnostics };
    }
}

