import * as vscode from "vscode";
import * as lang from "./language";
import { Controller } from "./controller";
import { SyntaxError, parse } from './parser';
import { traverse } from './traverser';
import type * as tree from './tree';

import { existsSync, promises } from 'node:fs';
import { relative } from 'node:path';


type DocumentUpdateQuery = { type: 'Document', document: vscode.TextDocument };
type FileUpdateQuery = { type: 'File', uri: vscode.Uri };

type IncludeArgument = {
    range: vscode.Range,
    raw: string,
    builtin: boolean,
    baseUri?: vscode.Uri,
};

class IgorproDocumentLink extends vscode.DocumentLink {
    includeArgument: IncludeArgument;
    constructor(range: vscode.Range, includeArgument: IncludeArgument) {
        super(range, undefined);
        this.includeArgument = includeArgument;
    }
}

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
export class FileController extends Controller<lang.FileUpdateSession> implements vscode.DefinitionProvider, vscode.DocumentSymbolProvider, vscode.WorkspaceSymbolProvider, vscode.DocumentLinkProvider<IgorproDocumentLink>, vscode.DocumentDropEditProvider, vscode.TextDocumentContentProvider {

    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    public externalOperationIdentifiers: string[];

    /**
     * Return the path to a special directory.
     * 
     * The root of "app" domain is "Igor Pro N Folder" folder in the Applications folder.
     * This folder contains "User Procedures", "WaveMetrics Procedures", "Igor Procedures", etc.
     * 
     * The root of "user" domain is "Igor Pro N User Files" folder.
     * This folder contains "User Procedures", "Igor Procedures", etc.
     */

    getSpecialDirPath(domain: 'user' | 'app', dirName?: 'User Procedures' | 'WaveMetrics Procedures') {
        let basePath: string | undefined;
        if (domain === 'app') {
            if (process.platform === 'win32') {
                basePath = `/C:/Program Files/WaveMetrics/Igor Pro ${this.igorVersion.major} Folder`;
            } else if (process.platform === 'darwin') {
                basePath = `/Applications/Igor Pro ${this.igorVersion.major} Folder`;
            }
        } else if (domain === 'user') {
            const homedir = process.env.HOME || process.env.USERPROFILE; // || os.homedir();
            if (homedir) {
                basePath = `${homedir}/Documents/WaveMetrics/Igor Pro ${this.igorVersion.major} User Files`;
            }
        }
        if (!dirName) {
            return basePath;
        } else {
            return basePath ? basePath + '/' + dirName : undefined;
        }
    }

    constructor(context: vscode.ExtensionContext, externalOperationIdentifiers: string[]) {
        super(context);

        this.externalOperationIdentifiers = externalOperationIdentifiers;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('igorpro');

        const showWorkspaceSymbolsJsonCommandHandler = async () => {
            // When the extension is activated by the command, `updateSessionMap`
            // is empty at the moment. Wait for a while, and then promise objects
            //  are added into `updateSessionMap`.
            if (this.updateSessionMap.size === 0) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            const categories = ['constant', 'picture', 'structure', 'macro', 'function'] as const;
            type Category = typeof categories[number];
            const obj: { [K in Category]: Required<lang.ReferenceBookLike>[K] } = { constant: {}, picture: {}, structure: {}, macro: {}, function: {}, };
            for (const [uriString, session] of this.updateSessionMap.entries()) {
                const refBook = (await session.promise)?.refBook;
                if (refBook === undefined) { continue; }

                const refBookLike = lang.categorizeRefBook(refBook, categories, true);
                for (const [category, refSheet] of Object.entries(refBookLike)) {
                    const category2 = category as keyof typeof refBookLike;
                    if (category2 === 'constant' || category2 === 'picture' || category2 === 'structure' || category2 === 'macro' || category2 === 'function') {
                        obj[category2] = Object.assign(obj[category2], refSheet);
                    }
                }
            }
            const content = JSON.stringify(obj, (key, value) => key === 'location' || key === 'category' ? undefined : value, 2);
            const document = await vscode.workspace.openTextDocument({ language: 'json', content: content });
            vscode.window.showTextDocument(document, { preview: false });
        };

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
                    const parsedData = await this.updateSessionMap.get(uriString)?.promise;
                    if (parsedData) {
                        parsedData.tree = undefined;
                        parsedData.symbols = undefined;
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
            vscode.commands.registerCommand('igorpro.showWorkspaceSymbolsJson', showWorkspaceSymbolsJsonCommandHandler),
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
        // Clear caches.
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
            const promise: Promise<lang.ParsedFileData | undefined> = (query.type === 'Document') ?
                Promise.resolve().then(() => analyzeDocumentContent(query.document.getText(), true, true, this.externalOperationIdentifiers, tokenSource.token)) :
                analyzeContentOfUri(query.uri, false, false, this.externalOperationIdentifiers, tokenSource.token);
            const session: lang.FileUpdateSession = { promise, tokenSource };
            // Attach a callback that will clean the cancellation token when update is finished.
            session.promise.finally(() => {
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
     * Required implementation of vscode.CompletionItemProvider, overriding the super class.
     */
    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.DefinitionLink[] | undefined> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // Seek the identifier.
        const locations: vscode.Location[] = [];
        for (const [uriString, session] of this.updateSessionMap.entries()) {
            const uri = vscode.Uri.parse(uriString);

            // Scan all types of symbols in the database of the respective files.
            const refItem = (await session.promise)?.refBook.get(selectorName);
            if (token.isCancellationRequested) { return; }
            if (refItem && refItem.location) {
                locations.push(new vscode.Location(uri, lang.convertRange(refItem.location)));
            }
        }
        return locations;
    }

    /**
     * Required implementation of `vscode.DocumentSymbolProvider`.
     */
    public async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[] | undefined> {
        if (token.isCancellationRequested) { return; }

        return (await this.updateSessionMap.get(document.uri.toString())?.promise)?.symbols;
    }

    /**
     * Required implementation of `vscode.WorkspaceSymbolProvider`.
     * 
     * This function looks for all symbol definitions that matched with `query` from the workspace.
     */
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
                    const symbolKind = lang.referenceCategoryMetadata[refItem.category].symbolKind;
                    symbols.push(new vscode.SymbolInformation(name, symbolKind, '', location));
                }
            }
        }
        return symbols;
    }

    /**
     * Required implementation of `vscode.DocumentLinkProvider`.
     */
    public provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<IgorproDocumentLink[] | undefined> {
        if (token.isCancellationRequested) { return; }

        const includeArguments = parseIncludeStatements(document.getText(), vscode.Uri.joinPath(document.uri, '..'));
        return includeArguments.map(arg => new IgorproDocumentLink(arg.range, arg));
    }

    /**
     * Optional implementation of `vscode.DocumentLinkProvider`.
     */
    public resolveDocumentLink(link: IgorproDocumentLink, token: vscode.CancellationToken): vscode.ProviderResult<IgorproDocumentLink> {
        if (token.isCancellationRequested) { return; }

        return this.findUriForIncludeArgument(link.includeArgument).then(
            uri => { link.target = uri; return link; }
        );
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
                        const pathSegments = path.split('/');
                        const lastPathSegment = pathSegments[pathSegments.length - 1];
                        const baseName = lastPathSegment.substring(0, lastPathSegment.length - 4);
                        let specialDir: string | undefined;
                        if ((specialDir = this.getSpecialDirPath('app', 'WaveMetrics Procedures')) !== undefined && path.startsWith(specialDir)) {
                            return `#include <${baseName}>\n`;
                        } else if ((specialDir = this.getSpecialDirPath('app', 'User Procedures')) !== undefined && path.startsWith(specialDir)) {
                            return `#include "${baseName}"\n`;
                        } else if ((specialDir = this.getSpecialDirPath('user', 'User Procedures')) !== undefined && path.startsWith(specialDir)) {
                            return `#include "${baseName}"\n`;
                        } else {
                            // Show in relative path.
                            // While a Relative path can have three bases
                            // the Igor Pro Folder, the Igor Pro User Files folder,
                            // and the folder containing the procedure file, 
                            // here the base is the last one.
                            const pathFrom = vscode.Uri.joinPath(document.uri, '..').path;
                            const pathTo = path.substring(0, path.length - 4);
                            const relPath = relative(pathFrom, pathTo);
                            return `#include "${convertPosixPathToHfsPath(relPath)}"\n`;
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
                    const tree = parse(editor.document.getText(), { operationIdentifiers: this.externalOperationIdentifiers });
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

    async findUriForIncludeArgument(incArg: IncludeArgument): Promise<vscode.Uri | undefined> {
        if (incArg.builtin) {
            // In case the path is enclosed with brackets, like
            // `#include <ipffile>`, then the file should be somewhere
            // in "WaveMetrics Procedures" folder or its subfolder.
            const basePath = this.getSpecialDirPath('app', 'WaveMetrics Procedures');
            if (basePath !== undefined) {
                for await (const path of promises.glob(`**/${incArg.raw}.ipf`, { cwd: basePath })) {
                    return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                }
            }
        } else if (!incArg.raw.includes(':')) {
            // In case the path does not contain path separator and is
            // enclosed with quotation marks, like `#include "ipffile"`,
            // then the file should be somewhere in "User Procedures" 
            // or its subfolder.
            // There are two "User Procedures" folders. One is in
            // "Igor Pro Folder" and the other is in "Igor Pro User Files".
            const domains = ['app', 'user'] as const;
            for (const domain of domains) {
                const basePath = this.getSpecialDirPath(domain, 'User Procedures');
                if (basePath !== undefined) {
                    for await (const path of promises.glob(`**/${incArg.raw}.ipf`, { cwd: basePath })) {
                        return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                    }
                }
            }
        } else if (!incArg.raw.startsWith(':')) {
            // In case the path is an aboslute path, like
            // #include "Hard Drive:absolute:path:to:ipffile",
            const path = convertHfsPathToPosixPath(incArg.raw + '.ipf');
            const uri2 = path ? vscode.Uri.file(path) : undefined;
            return uri2 && existsSync(uri2.path) ? uri2 : undefined;
            // return (uri2 && (await vscode.workspace.fs.stat(uri2)).type & vscode.FileType.File) ? uri2 : undefined;
        } else {
            // In case the path is a relative path, like
            // `#include ":relative:path:to:ipffile"`,
            // then the relative path should be revolved to either 
            // the Igor Pro Folder, the Igor Pro User Files folder,
            // or the folder containing the procedure file that
            // contains the `#include` statement.
            const basePaths = [this.getSpecialDirPath('app'), this.getSpecialDirPath('user'), incArg.baseUri?.path];
            const path = convertHfsPathToPosixPath(incArg.raw + '.ipf');
            if (path) {
                for (const basePath of basePaths) {
                    if (basePath) {
                        const uri2 = vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                        if (existsSync(uri2.path)) {
                            // if ((await vscode.workspace.fs.stat(uri2)).type & vscode.FileType.File) {
                            return uri2;
                        }
                    }
                }
            }
        }
        return undefined;
    }
}

async function analyzeContentOfUri(uri: vscode.Uri, diagnose: boolean, isInEditor: boolean, operationIdentifiers: string[], token: vscode.CancellationToken): Promise<lang.ParsedFileData | undefined> {
    const uint8Array = await vscode.workspace.fs.readFile(uri);
    const content = await vscode.workspace.decode(uint8Array, { uri });
    return analyzeDocumentContent(content, diagnose, isInEditor, operationIdentifiers, token);
}

function analyzeDocumentContent(content: string, diagnose: boolean, isInEditor: boolean, operationIdentifiers: string[], token: vscode.CancellationToken) {
    // private parseDocumentContents(contents: string, uri: vscode.Uri, isOpenDocument: boolean, diagnoseProblems: boolean) {
    if (token.isCancellationRequested) { return undefined; }

    let tree: tree.Program;
    let diagnostics: vscode.Diagnostic[] | undefined;
    try {
        tree = parse(content, { operationIdentifiers });
    } catch (error) {
        if (error instanceof SyntaxError) {
            if (diagnose) {
                diagnostics = [new vscode.Diagnostic(lang.convertRange(error.location), error.message, vscode.DiagnosticSeverity.Error)];
            }
        } else {
            console.log('Unknown error in parsing', error);
            if (diagnose) {
                diagnostics = [new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Unknown error in parsing', vscode.DiagnosticSeverity.Error)];
            }
        }
        return { refBook: new Map(), diagnostics };
    }

    if (token.isCancellationRequested) { return undefined; }

    if (diagnose) {
        diagnostics = tree.problems.map(
            problem => new vscode.Diagnostic(lang.convertRange(problem.loc), problem.message, problem.severity)
        );
    }

    const [refBook, symbols] = traverse(tree);

    if (isInEditor) {
        return { refBook, tree, symbols, diagnostics };
    } else {
        return { refBook, diagnostics };
    }
}


function parseIncludeStatements(content: string, baseUri: vscode.Uri): IncludeArgument[] {
    const lines = content.split(/\n|\r\n?/);

    const includeRegExp: RegExp = /^(#include\b\s*)(<([^"<>]+)>|"([^"<>]+)")/;
    const includeArguments: IncludeArgument[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineText = lines[lineIndex];
        const matches = lineText.match(includeRegExp);
        if (matches !== null) {
            const range = new vscode.Range(lineIndex, matches[1].length + 1, lineIndex, matches[1].length + matches[2].length - 1);
            if (matches[2].startsWith('<')) {
                includeArguments.push({ range, raw: matches[3], builtin: true });
            } else {
                includeArguments.push({ range, raw: matches[4], builtin: false, baseUri });
            }
        }
    }
    return includeArguments;
}

/**
 * Convert a classic Mac OS path (also known as HFS path) to a POSIX path.
 * e.g.,
 * - absolute path:
 *   - 'Hard Drive:absolute:path:to:file.txt' -> '/absolute/path/to/file.txt' (macOS)
 *   - 'C:absolute:path:to:file.txt' -> '/C:/absolute/path/to/file.txt' (Windows)
 * - relative path:
 *   - ':relative:path:to:file.txt' -> './relative/path/to/file.txt'
 *   - ':::path1::path2:path3:' -> './../../path1/../path2/path3/'
 * @param hfsPath HFS path.
 * @returns POSIX path.
 */
function convertHfsPathToPosixPath(hfsPath: string) {
    // Replace path separators, taking parent directory pattern (`::`) into
    // consideration.
    const segments = hfsPath.split(':').map((segment, index, array) => {
        if (segment.length === 0) {
            if (index === 0) {
                return '.';
            } else if (index === array.length - 1) {
                return '';
            } else {
                return '..';
            }
        } else {
            return segment;
        }
    });

    // In case the path is an absolute path, a partition name at the head of an
    // HFS path is treated differently on Windows and macOS. On Windows 
    // it is used like `/C:/parent/child`. On macOS it is not used in a POSIX
    // path.
    if (!hfsPath.startsWith(':')) {
        if (process.platform === 'win32') {
            if (segments.length > 0) {
                segments[0] = segments[0] + ':';
            }
        } else if (process.platform === 'darwin') {
            if (segments.length > 0) {
                segments[0] = '';
            }
        } else {
            return undefined;
        }
    }
    return segments.join('/');
}

/**
 * Convert a POSIX path to a classic Mac OS path (also known as HFS path).
 */
function convertPosixPathToHfsPath(posixPath: string) {
    const segments: string[] = [];
    posixPath.split('/').forEach(segment => {
        if (segment === '.') {
            // do nothing
        } else if (segment === '..') {
            segments.push('');
        } else {
            segments.push(segment.replace(/:/g, ''));
        }
    });

    if (posixPath.startsWith('/')) {
        if (process.platform === 'win32') {
            segments.shift();
        } else if (process.platform === 'darwin') {
            // Since a partition name is not included in a POSIX path, here
            // the default value is used instead.
            segments[0] = 'Macintosh HD';
        } else {
            return undefined;
        }
    } else {
        segments.unshift('');
    }
    return segments.join(':');
}
