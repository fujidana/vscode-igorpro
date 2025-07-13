import * as vscode from "vscode";
import * as lang from "./language";
import { Controller } from "./controller";
import { SyntaxError, parse } from './parser';
import { traverse } from './traverser';
import type * as tree from './tree';

/**
 * Get a set of the URIs of supported files from workspaces.
 * 
 * @returns a promise of a set of URI strings
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
export class FileController extends Controller implements vscode.DefinitionProvider, vscode.DocumentSymbolProvider, vscode.WorkspaceSymbolProvider, vscode.DocumentDropEditProvider, vscode.TextDocumentContentProvider {

    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    private readonly treeCollection: Map<string, tree.Program>;
    private readonly symbolCollection: Map<string, vscode.DocumentSymbol[]>;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('igorpro');
        this.treeCollection = new Map();
        this.symbolCollection = new Map();

        const inspectSyntaxTreeCommandHandler = async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'igorpro') {
                const uri = vscode.Uri.parse(lang.AST_URI).with({ query: editor.document.uri.toString() });
                vscode.window.showTextDocument(uri, { preview: false });
            }
        };

        /**  Event handler invoked when the document is changed. */
        const textDocumentDidChangeListener = (event: vscode.TextDocumentChangeEvent) => {
            const document = event.document;
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        /**
         * Event handler invoked when the document is opened.
         * It is also invoked after the user manually changed the language identifier.
         */
        const textDocumentDidOpenListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        /** Event handler invoked when the document is saved. */
        const textDocumentDidSaveListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        /**
         * Event handler invoked when the document is closed.
         * It is also invoked after the user manually changed the language identifier.
         */
        const textDocumentDidCloseListener = async (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document)) {
                const documentUriString = document.uri.toString();

                this.treeCollection.delete(documentUriString);
                this.symbolCollection.delete(documentUriString);
                this.diagnosticCollection.delete(document.uri);

                // check whether the file is in a workspace folder.
                // If not in a folder, delete from the database.
                const filesInWorkspaces = await findFilesInWorkspaces();
                if (!filesInWorkspaces.has(documentUriString)) {
                    // if file does not exist in a workspace folder, clear all.
                    this.referenceCollection.delete(documentUriString);
                    this.completionItemCollection.delete(documentUriString);
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
                    oldUriStrings = [...this.referenceCollection.keys()].filter(uriString => uriString.startsWith(oldDir));
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
                            oldUriStrings = [...this.referenceCollection.keys()].filter(uriString => uriString.startsWith(oldDir));
                        }
                        this.reflectFileOperationInCollections(oldUriStrings);
                    }
                );
                event.waitUntil(promise);
            }
        };

        // a hander invoked when the configuration is changed
        const configurationDidChangeListener = (event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration('files.associations') || event.affectsConfiguration('files.encoding')) {
                this.refreshCollections();
            }
        };

        const workspaceFoldersDidChangeListener = (event: vscode.WorkspaceFoldersChangeEvent) => {
            this.refreshCollections();
        };

        // Asynchronously scan files and refresh the collection.
        this.refreshCollections();

        // Register providers and event handlers.
        context.subscriptions.push(
            // Register command handlers.
            vscode.commands.registerCommand('igorpro.inspectSyntaxTree', inspectSyntaxTreeCommandHandler),

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
        // Clear cache for old URIs.
        if (oldUriStrings) {
            for (const oldUriString of oldUriStrings) {
                this.referenceCollection.delete(oldUriString);
                this.diagnosticCollection.delete(vscode.Uri.parse(oldUriString));
                this.completionItemCollection.delete(oldUriString);
            }
        }

        if (newUriStrings) {
            // Do nothing for opened document files because they are handled by
            // `onDidOpenTextDocument` and `onDidCloseTextDocument` events.
            this.parseDocumentContentsOfUriStrings(newUriStrings, false);
        }
    }

    /**
     * scan open files and other files in workspace folders.
     * invoked manually when needed.
     */
    private async refreshCollections() {
        // Clear caches.
        this.referenceCollection.clear();
        this.diagnosticCollection.clear();
        this.completionItemCollection.clear();
        this.treeCollection.clear();
        this.symbolCollection.clear();

        // Parse documents opened by editors.
        return this.parseDocumentContentsOfUriStrings(await findFilesInWorkspaces(), true);
    }

    /**
     * Subroutine to parse the contents of multiple files specified by URIs.
     */
    private async parseDocumentContentsOfUriStrings(targetUriStrings: Iterable<string>, parseEditorDocuments: boolean) {
        // Collect URIs of documents in the editor and parse it if `parseEditorDocuments` is true.
        const documentUriStrings: string[] = [];
        for (const document of vscode.workspace.textDocuments) {
            const uriString = document.uri.toString();
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git' && !documentUriStrings.includes(uriString)) {
                if (parseEditorDocuments) {
                    this.parseDocumentContents(document.getText(), document.uri, true, true);
                }
                documentUriStrings.push(uriString);
            }
        }

        const nonDocumentUris: vscode.Uri[] = [];
        for (const uriString of targetUriStrings) {
            if (!documentUriStrings.includes(uriString)) {
                nonDocumentUris.push(vscode.Uri.parse(uriString));
            }
        }

        for (const uri of nonDocumentUris) {
            // const encoding = vscode.workspace.getConfiguration('files', { languageId: 'igorpro', uri: newUri }).get<string>('encoding', 'utf8');
            // const contents = await vscode.workspace.decode(await vscode.workspace.fs.readFile(newUri), { encoding });
            const contents = await vscode.workspace.decode(await vscode.workspace.fs.readFile(uri), { uri });
            this.parseDocumentContents(contents, uri, false, false);
        }
    }

    private parseDocumentContents(contents: string, uri: vscode.Uri, isOpenDocument: boolean, diagnoseProblems: boolean) {
        const uriString = uri.toString();

        let tree: tree.Program;
        try {
            tree = parse(contents);
        } catch (error) {
            if (error instanceof SyntaxError) {
                if (diagnoseProblems) {
                    const diagnostic = new vscode.Diagnostic(lang.convertRange(error.location), error.message, vscode.DiagnosticSeverity.Error);
                    this.diagnosticCollection.set(uri, [diagnostic]);
                }
            } else {
                console.log('Unknown error in parsing', error);
                if (diagnoseProblems) {
                    const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Unknown error in sytax parsing', vscode.DiagnosticSeverity.Error);
                    this.diagnosticCollection.set(uri, [diagnostic]);
                }
            }
            // update with an empty map object.
            this.referenceCollection.set(uriString, new Map());
            // this.updateCompletionItemsForUriString(uriString);
            return false;
        }

        this.diagnosticCollection.delete(uri);
        if (diagnoseProblems) {
            this.diagnosticCollection.set(uri, tree.problems.map(
                problem => new vscode.Diagnostic(lang.convertRange(problem.loc), problem.message, problem.severity))
            );
        }

        const [storage, symbols] = traverse(tree);

        if (isOpenDocument) {
            this.treeCollection.set(uriString, tree);
            this.symbolCollection.set(uriString, symbols);
        }

        this.referenceCollection.set(uriString, storage);
        this.updateCompletionItemsForUriString(uriString);

        return true;
    }

    /**
     * Required implementation of vscode.CompletionItemProvider, overriding the super class.
     */
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // Seek the identifier.
        const locations: vscode.Location[] = [];
        for (const [uriString, refBook] of this.referenceCollection.entries()) {
            const uri = vscode.Uri.parse(uriString);

            // seek through storages for all types of symbols
            const refItem = refBook.get(selectorName);
            if (refItem && refItem.location) {
                locations.push(new vscode.Location(uri, lang.convertRange(refItem.location)));
            }
        }
        return locations;
    }

    /**
     * Required implementation of `vscode.DocumentSymbolProvider`.
     */
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        if (token.isCancellationRequested) { return; }

        return this.symbolCollection.get(document.uri.toString());
    }

    /**
     * Required implementation of `vscode.WorkspaceSymbolProvider`.
     * 
     * This function looks for all symbol definitions that matched with `query` from the workspace.
     */
    public provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[]> {
        if (token.isCancellationRequested) { return; }

        // exit when the query is not empty and contains characters not allowed in an identifier.
        if (!/^[a-zA-Z0-9_]*$/.test(query)) { return; }

        // create a regular expression that filters symbols using the query
        // const regExp = new RegExp(query.replace(/(?=[_A-Z])/g, '.*'), 'i');
        const regExp = new RegExp(query.split('').join('.*'), 'i'); // e.g., 'abc' => /a.*b.*c/i

        // seek the identifier
        const symbols: vscode.SymbolInformation[] = [];
        for (const [uriString, refBook] of this.referenceCollection.entries()) {
            // // skip storage for local variables
            // if (uriString === igorpro.ACTIVE_FILE_URI) { continue; }

            const uri = vscode.Uri.parse(uriString);

            // find all items from each storage.
            for (const [identifier, refItem] of refBook.entries()) {
                if ((query.length === 0 || regExp.test(identifier)) && refItem.location) {
                    const name = (refItem.category === 'function') ? identifier + '()' : identifier;
                    const location = new vscode.Location(uri, lang.convertRange(refItem.location));
                    const symbolKind = lang.referenceCategoryMetadata[refItem.category].symbolKind;
                    symbols.push(new vscode.SymbolInformation(name, symbolKind, '', location));
                }
            }
        }
        return symbols;
    }

    /**
     * Required implementation of `vscode.DocumentDropEditProvider`.
     * 
     * This function is called when a file is dropped into the editor.
     * This function returns a path string like `#include "..."`.
     */
    public provideDocumentDropEdits(document: vscode.TextDocument, position: vscode.Position, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentDropEdit> {
        // The value for 'text/uri-list' key in dataTransfer is a string of file list separated by '\r\n'.
        const uriList = dataTransfer.get('text/uri-list');
        if (uriList && typeof uriList.value === 'string') {
            const ipfPathList = uriList.value.split('\r\n').map(uriString => vscode.Uri.parse(uriString).path).filter(path => path.toLowerCase().endsWith('.ipf'));
            if (ipfPathList.length > 0) {
                return new vscode.DocumentDropEdit(ipfPathList.map(
                    path => {
                        const pathComponents = path.split('/');
                        const lastPathComponent = pathComponents[pathComponents.length - 1];
                        if (pathComponents.includes('WaveMetrics Procedures')) {
                            return `#include <${lastPathComponent.substring(0, lastPathComponent.length - 4)}>\n`;
                        } else if (pathComponents.includes('User Procedures')) {
                            return `#include "${lastPathComponent.substring(0, lastPathComponent.length - 4)}"\n`;
                        } else {
                            // TODO: This should return a full path. Currently only a file name.
                            return `#include "${lastPathComponent.substring(0, lastPathComponent.length - 4)}"\n`;
                        }
                    }
                ).join(''));
            }
        }
        return undefined;
    }

    /**
     * required implementation of vscode.TextDocumentContentProvider
     */
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        if (token.isCancellationRequested) { return; }

        if (lang.AST_URI === uri.with({ query: '' }).toString()) {
            const docUri = vscode.Uri.parse(uri.query);
            const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === docUri.toString());
            if (editor) {
                try {
                    const tree = parse(editor.document.getText());
                    // const content = JSON.stringify(tree, null, 2);
                    return JSON.stringify(tree, (key, value) => { return key === 'loc' ? undefined : value; }, 2);
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        vscode.window.showErrorMessage('Failed to parse the editor contents.');
                    } else {
                        vscode.window.showErrorMessage('Unknown error.');
                    }
                }
            }
        }
    }
}
