import * as vscode from "vscode";
import * as lang from "./igorpro";
import { Provider } from "./provider";
import { SyntaxError, parse } from './grammar';
import type * as tree from './igorproTree';

/**
 * Get a set of the URIs of supported files from workspaces
 * @returns a promise of Set of a string representation of URIs
 */
async function findFilesInWorkspaces() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const uriStringSet = new Set<string>();

    if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
            // refer to `files.associations` configuration property
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
 * Provider class for user's documents.
 * This class manages documents opened in editors and other documents in the current workspaces.
 */
export class UserProvider extends Provider implements vscode.DefinitionProvider, vscode.DocumentSymbolProvider, vscode.WorkspaceSymbolProvider, vscode.DocumentDropEditProvider, vscode.TextDocumentContentProvider {
    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    // private readonly treeCollection: Map<string, tree.Program>;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('igorpro');
        // this.treeCollection = new Map();

        const inspectSyntaxTreeCommandHandler = async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'igorpro') {
                const uri = vscode.Uri.parse(lang.AST_URI).with({ query: editor.document.uri.toString() });
                vscode.window.showTextDocument(uri, { preview: false });
            }
        };

        // a hander invoked when the document is changed
        const textDocumentDidChangeListener = (event: vscode.TextDocumentChangeEvent) => {
            const document = event.document;
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        // a hander invoked when the document is opened
        // this is also invoked after the user manually changed the language id
        const textDocumentDidOpenListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        // a hander invoked when the document is saved
        const textDocumentDidSaveListener = (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
            }
        };

        // a hander invoked when the document is closed
        // this is also invoked after the user manually changed the language id
        const textDocumentDidCloseListener = async (document: vscode.TextDocument) => {
            if (vscode.languages.match(lang.SELECTOR, document)) {
                const documentUriString = document.uri.toString();

                // this.treeCollection.delete(documentUriString);

                // check whether the file is in a workspace folder. If not in a folder, delete from the database.
                const filesInWorkspaces = await findFilesInWorkspaces();
                if (filesInWorkspaces.has(documentUriString)) {
                    // if file also exists in a workspace folder...
                    // clear diagnostics if setting for workspace.diagnoseProblem is false. 
                    // const diagnoseInWorkspace = vscode.workspace.getConfiguration('vscode-igorpro.workspace', document).get<boolean>('diagnoseProblems', false);
                    // if (!diagnoseInWorkspace) {
                    this.diagnosticCollection.delete(document.uri);
                    // }
                } else {
                    // if file does not exist in a workspace folder, clear all.
                    this.storageCollection.delete(documentUriString);
                    this.diagnosticCollection.delete(document.uri);
                    this.completionItemCollection.delete(documentUriString);
                }
            }
        };

        // const activeTextEditorDidChangeListener = (editor: vscode.TextEditor | undefined) => {
        //     if (editor) {
        //         const document = editor.document;
        //         this.parseDocumentContents(document.getText(), document.uri, true, true);
        //     }
        // };

        // // a hander invoked after files are created
        // const fileDidCreateListener = async (event: vscode.FileCreateEvent) => {
        //     const filesInWorkspaces = await findFilesInWorkspaces();
        //     const newUriStringSet = new Set<string>();
        //     for (const newUri of event.files) {
        //     }
        // };

        // a hander invoked after files are renamed
        const fileDidRenameListener = async (event: vscode.FileRenameEvent) => {
            const filesInWorkspaces = await findFilesInWorkspaces();
            let oldUriStringSet: Set<string> | undefined;
            let newUriStringSet: Set<string> | undefined;

            for (const { oldUri, newUri } of event.files) {
                const stat = await vscode.workspace.fs.stat(newUri);

                if (stat.type === vscode.FileType.File) {
                    oldUriStringSet = new Set([oldUri.toString()]);
                    if (filesInWorkspaces.has(newUri.toString())) {
                        newUriStringSet = new Set([newUri.toString()]);
                    }
                } else if (stat.type === vscode.FileType.Directory) {
                    const oldDirUriString = oldUri.toString() + "/";
                    oldUriStringSet = new Set([...this.storageCollection.keys()].filter(uriString => uriString.startsWith(oldDirUriString)));

                    const newDirUriString = newUri.toString() + "/";
                    newUriStringSet = new Set([...filesInWorkspaces].filter(uriString => uriString.startsWith(newDirUriString)));
                }
            }

            this.applyFileOperation(oldUriStringSet, newUriStringSet);
        };

        // a hander invoked before files are deleted
        const fileWillDeleteListener = async (event: vscode.FileWillDeleteEvent) => {
            for (const oldUri of event.files) {
                const promise = vscode.workspace.fs.stat(oldUri).then(
                    stat => {
                        let oldUriStringSet: Set<string> | undefined;
                        if (stat.type === vscode.FileType.File) {
                            oldUriStringSet = new Set([oldUri.toString()]);
                        } else if (stat.type === vscode.FileType.Directory) {
                            const oldDirUriString = oldUri.toString() + "/";
                            oldUriStringSet = new Set([...this.storageCollection.keys()].filter(uriString => uriString.startsWith(oldDirUriString)));
                        }
                        this.applyFileOperation(oldUriStringSet);
                    }
                );
                event.waitUntil(promise);
            }
        };


        const workspaceFoldersDidChangeListener = (event: vscode.WorkspaceFoldersChangeEvent) => {
            this.refreshCollections();
        };

        context.subscriptions.push(
            // register command handlers
            vscode.commands.registerCommand('igorpro.inspectSyntaxTree', inspectSyntaxTreeCommandHandler),

            // register document-event listeners
            vscode.workspace.onDidChangeTextDocument(textDocumentDidChangeListener),
            vscode.workspace.onDidOpenTextDocument(textDocumentDidOpenListener),
            vscode.workspace.onDidSaveTextDocument(textDocumentDidSaveListener),
            vscode.workspace.onDidCloseTextDocument(textDocumentDidCloseListener),
            // vscode.window.onDidChangeActiveTextEditor(activeTextEditorDidChangeListener),

            // register file-event listeners
            // vscode.workspace.onDidCreateFiles(fileDidCreateListener),
            vscode.workspace.onDidRenameFiles(fileDidRenameListener),
            vscode.workspace.onWillDeleteFiles(fileWillDeleteListener),

            // register other event listeners
            // vscode.workspace.onDidChangeConfiguration(configurationChangeListener),
            vscode.workspace.onDidChangeWorkspaceFolders(workspaceFoldersDidChangeListener),

            // register providers
            vscode.languages.registerDefinitionProvider(lang.SELECTOR, this),
            vscode.languages.registerDocumentSymbolProvider(lang.SELECTOR, this),
            vscode.languages.registerWorkspaceSymbolProvider(this),
            vscode.languages.registerDocumentDropEditProvider(lang.SELECTOR, this),
            vscode.workspace.registerTextDocumentContentProvider('igorpro', this),

            // register diagnostic collection
            this.diagnosticCollection,
        );

        // asynchronously scan files and refresh the collection
        this.refreshCollections();
    }

    /**
     * Update the database.
     * @param oldUriStringSet a set of files of which metadata will be removed. Mismatched files are just ignored.
     * @param newUriStringSet a set of files of which metadata will be created. The file paths should be filtered beforehand.
     */
    private async applyFileOperation(oldUriStringSet?: Set<string>, newUriStringSet?: Set<string>) {
        // unregister metadata for old URIs.
        if (oldUriStringSet) {
            for (const oldUriString of oldUriStringSet) {
                this.storageCollection.delete(oldUriString);
                this.diagnosticCollection.delete(vscode.Uri.parse(oldUriString));
                this.completionItemCollection.delete(oldUriString);
            }
        }

        // register metadata for new URIs.
        if (newUriStringSet) {
            // make a list of opened documents.
            // Do nothing for these files because they are handled by
            // onDidOpenTextDocument and onDidCloseTextDocument events.
            const documentUriStringSet = new Set(
                vscode.workspace.textDocuments.filter(
                    document => (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git')
                ).map(
                    document => document.uri.toString()
                )
            );

            for (const newUriString of newUriStringSet) {
                if (!documentUriStringSet.has(newUriString)) {
                    const newUri = vscode.Uri.parse(newUriString);
                    const contents = await vscode.workspace.decode(await vscode.workspace.fs.readFile(newUri), { uri: newUri });
                    // const diagnoseInWorkspace = vscode.workspace.getConfiguration('vscode-igorpro.workspace', newUri).get<boolean>('diagnoseProblems', false);
                    // this.parseDocumentContents(contents, newUri, false, diagnoseInWorkspace);
                    this.parseDocumentContents(contents, newUri, false, false);
                }
            }
        }
    }

    /**
     * @param program Parser AST object.
     * @param uriString document URI string.
     * @param position the current cursor position. If not given, top-level symbols (global variables, constant, macro and functions) are picked up.
     */
    private collectSymbolsFromTree(program: tree.Program, uriString: string, position?: vscode.Position) {

        const constantRefMap: lang.ReferenceMap = new Map();
        // const menuRefMap: igorpro.ReferenceMap = new Map();
        const pictureRefMap: lang.ReferenceMap = new Map();
        const structureRefMap: lang.ReferenceMap = new Map();
        const macroRefMap: lang.ReferenceMap = new Map();
        const functionRefMap: lang.ReferenceMap = new Map();

        // const nestedNodes: string[] = [];
        function makeRefItem(node: tree.ParentDeclaration): lang.ReferenceItem {
            return {
                signature: node.id.name,
                description: node.leadingComments ? node.leadingComments.map(comment => comment.value).join('\n') : undefined,
                location: node.id.loc
            };
        }
        function makeSignatureForMacroAndFunc(node: tree.FunctionDeclaration | tree.MacroDeclaration): string {
            let signature = node.id.name;

            signature += '(' + node.params.map(param => {
                if (param.type === 'Identifier') {
                    return param.name;
                } else if (param.type === 'VariableDeclaration') {
                    return param.declarations.map(decl => decl.id).join(', ');
                } else {
                    return '';
                }
            }).join(', ');

            if (node.type === 'FunctionDeclaration' && node.optParams) {
                signature += '[' + node.optParams.map(param => {
                    if (param.type === 'Identifier') {
                        return param.name;
                    } else if (param.type === 'VariableDeclaration') {
                        return param.declarations.map(decl => decl.id).join(', ');
                    } else {
                        return '';
                    }
                }).join(', ') + ']';
            }
            signature += ')';

            if (node.subtype) {
                signature += ': ' + node.subtype;
            }
            return signature;
        }

        for (const node of program.body) {
            if (node.type === 'ConstantDeclaration') {
                const refItem = makeRefItem(node);
                refItem.static = node.static;
                constantRefMap.set(node.id.name.toLowerCase(), refItem);
            // } else if (node.type === 'MenuDeclaration') {
            //     menuRefMap.set(node.id.name.toLowerCase(), makeRefItem(node));
            } else if (node.type === 'PictureDeclaration') {
                const refItem = makeRefItem(node);
                refItem.static = node.static;
                pictureRefMap.set(node.id.name.toLowerCase(), refItem);
            } else if (node.type === 'StructureDeclaration') {
                const refItem = makeRefItem(node);
                refItem.static = node.static;
                structureRefMap.set(node.id.name.toLowerCase(), refItem);
            } else if (node.type === 'MacroDeclaration') {
                const refItem = makeRefItem(node);
                refItem.signature = makeSignatureForMacroAndFunc(node);
                macroRefMap.set(node.id.name.toLowerCase(), refItem);
            } else if (node.type === 'FunctionDeclaration') {
                const refItem = makeRefItem(node);
                refItem.static = node.static;
                refItem.signature = makeSignatureForMacroAndFunc(node);
                functionRefMap.set(node.id.name.toLowerCase(), refItem);
            }
        }

        this.storageCollection.set(uriString, new Map([
            [lang.ReferenceItemKind.constant, constantRefMap],
            // [igorpro.ReferenceItemKind.menu, menuRefMap],
            [lang.ReferenceItemKind.picture, pictureRefMap],
            [lang.ReferenceItemKind.macro, macroRefMap],
            [lang.ReferenceItemKind.function, functionRefMap],
        ]));
    }

    private parseDocumentContents(contents: string, uri: vscode.Uri, isOpenDocument: boolean, diagnoseProblems: boolean) {
        const uriString = uri.toString();

        let program: tree.Program;
        try {
            program = parse(contents);
        } catch (error) {
            if (error instanceof SyntaxError) {
                if (diagnoseProblems) {
                    const diagnostic = new vscode.Diagnostic(lang.convertRange(error.location), error.message, vscode.DiagnosticSeverity.Error);
                    this.diagnosticCollection.set(uri, [diagnostic]);
                    // this.updateCompletionItemsForUriString(uriString);
                }
            } else {
                console.log('Unknown error in sytax parsing', error);
                if (diagnoseProblems) {
                    const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Unknown error in sytax parsing', vscode.DiagnosticSeverity.Error);
                    this.diagnosticCollection.set(uri, [diagnostic]);
                }
            }
            // update with an empty map object.
            this.storageCollection.set(uriString, new Map());
            return false;
        }

        this.diagnosticCollection.delete(uri);
        if (diagnoseProblems) {
            this.diagnosticCollection.set(uri, program.problems.map(
                problem => new vscode.Diagnostic(lang.convertRange(problem.loc), problem.message, problem.severity))
            );
        }

        // if (isOpenDocument) {
        //     this.treeCollection.set(uriString, program);
        // }

        this.collectSymbolsFromTree(program, uriString);
        this.updateCompletionItemsForUriString(uriString);

        return true;
    }

    /**
     * scan open files and other files in workspace folders.
     * invoked manually when needed.
     */
    private async refreshCollections() {
        // clear the caches
        this.storageCollection.clear();
        this.diagnosticCollection.clear();
        this.completionItemCollection.clear();

        // parse documents opened by editors
        const documentUriStringSet = new Set<string>();
        for (const document of vscode.workspace.textDocuments) {
            if (vscode.languages.match(lang.SELECTOR, document) && document.uri.scheme !== 'git') {
                this.parseDocumentContents(document.getText(), document.uri, true, true);
                documentUriStringSet.add(document.uri.toString());
            }
        }

        // parse the other files in workspace folders.
        const filesInWorkspaces = await findFilesInWorkspaces();

        for (const uriString of filesInWorkspaces) {
            if (!documentUriStringSet.has(uriString)) {
                const uri = vscode.Uri.parse(uriString);
                const contents = await vscode.workspace.decode(await vscode.workspace.fs.readFile(uri), { uri });
                // const diagnoseInWorkspace = vscode.workspace.getConfiguration('vscode-igorpro.workspace', uri).get<boolean>('diagnoseProblems', false);
                // this.parseDocumentContents(contents, uri, false, diagnoseInWorkspace);
                this.parseDocumentContents(contents, uri, false, false);
            }
        }
    }

    /**
     * Required implementation of vscode.DefinitionProvider
     */
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        if (token.isCancellationRequested) { return; }

        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) { return; }

        const selectorName = document.getText(range).toLowerCase();
        if (!/^[a-z][a-z0-9_]*$/.test(selectorName)) { return; }

        // seek the identifier
        const locations: vscode.Location[] = [];
        for (const [uriString, storage] of this.storageCollection.entries()) {
            const uri = vscode.Uri.parse(uriString);

            // seek through storages for all types of symbols
            for (const map of storage.values()) {
                const item = map.get(selectorName);
                if (item && item.location) {
                    locations.push(new vscode.Location(uri, lang.convertRange(item.location)));
                }
            }
        }
        return locations;
    }

    /**
     * Required implementation of vscode.DocumentSymbolProvider
     */
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        if (token.isCancellationRequested) { return; }

        let program: tree.Program;
        try {
            program = parse(document.getText());
        } catch (error) {
            return undefined;
        }

        // if (document.isUntitled) {
        //     const workspcaes = vscode.workspace.workspaceFolders;
        //     if (workspcaes !== undefined) {
        //         vscode.workspace.fs.writeFile(vscode.Uri.joinPath(workspcaes[0].uri, 'tmp.json'), new TextEncoder().encode(JSON.stringify(program.body, undefined, 2)));
        //     }
        //     console.log(JSON.stringify(program.body));
        // }

        function getDocumentSymbol(node: tree.ParentDeclaration | tree.SubmenuDeclaration, kind: vscode.SymbolKind) {
            if (node.loc && node.id.loc) {
                return new vscode.DocumentSymbol(node.id.name, '', kind, lang.convertRange(node.loc), lang.convertRange(node.id.loc));
            }
        }

        function getMenuDocumentSymbol(node: tree.MenuDeclaration | tree.SubmenuDeclaration) {
            const symbol = getDocumentSymbol(node, vscode.SymbolKind.Event);
            if (symbol) {
                for (const subnode of node.body) {
                    if (subnode.type === 'SubmenuDeclaration') {
                        const subsymbol = getMenuDocumentSymbol(subnode);
                        if (subsymbol) {
                            symbol.children.push(subsymbol);
                        }
                    }
                }
                return symbol;
            }
        }

        const symbols = new Array<vscode.DocumentSymbol>();
        let symbol: vscode.DocumentSymbol | undefined;

        for (const node of program.body) {
            if (node.type === 'ConstantDeclaration') {
                const symbol = getDocumentSymbol(node, vscode.SymbolKind.Constant);
                if (symbol) {
                    symbols.push(symbol);
                }
            } else if (node.type === 'MenuDeclaration') {
                const symbol = getMenuDocumentSymbol(node);
                if (symbol) {
                    symbols.push(symbol);
                }
            } else if (node.type === 'PictureDeclaration') {
                if ((symbol = getDocumentSymbol(node, vscode.SymbolKind.Object)) !== undefined) {
                    symbols.push(symbol);
                }
            } else if (node.type === 'StructureDeclaration') {
                if ((symbol = getDocumentSymbol(node, vscode.SymbolKind.Struct)) !== undefined) {
                    symbols.push(symbol);
                }
            } else if (node.type === 'MacroDeclaration') {
                if ((symbol = getDocumentSymbol(node, vscode.SymbolKind.Method)) !== undefined) {
                    symbols.push(symbol);
                }
            } else if (node.type === 'FunctionDeclaration') {
                if ((symbol = getDocumentSymbol(node, vscode.SymbolKind.Function)) !== undefined) {
                    symbols.push(symbol);
                }
            }
        }

        return symbols;
    }

    /**
     * Required implementation of vscode.WorkspaceSymbolProvider
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
        for (const [uriString, storage] of this.storageCollection.entries()) {
            // // skip storage for local variables
            // if (uriString === igorpro.ACTIVE_FILE_URI) { continue; }

            const uri = vscode.Uri.parse(uriString);

            // find all items from each storage.
            for (const [itemKind, map] of storage.entries()) {
                const symbolKind = lang.getReferenceItemKindMetadata(itemKind).symbolKind;
                for (const [identifier, refItem] of map.entries()) {
                    if (query.length === 0 || regExp.test(identifier)) {
                        if (refItem.location) {
                            const name = (itemKind === lang.ReferenceItemKind.function) ? identifier + '()' : identifier;
                            const location = new vscode.Location(uri, lang.convertRange(refItem.location));
                            symbols.push(new vscode.SymbolInformation(name, symbolKind, '', location));
                        }
                    }
                }
            }
        }
        return symbols;
    }

    /**
     * Required implementation of vscode.DocumentDropEditProvider
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
                        vscode.window.showErrorMessage('Failed in parsing the editor contents.');
                    } else {
                        vscode.window.showErrorMessage('Unknown error.');
                    }
                }
            }
        }
    }
}
