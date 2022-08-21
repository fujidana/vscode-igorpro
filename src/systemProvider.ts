import * as vscode from 'vscode';
import * as igorpro from './igorpro';
import { Provider } from "./provider";
import { TextDecoder } from 'util';

interface APIReference {
    constants: igorpro.ReferenceItem[];
    variables: igorpro.ReferenceItem[];
    functions: igorpro.ReferenceItem[];
    operations: igorpro.ReferenceItem[];
    keywords: igorpro.ReferenceItem[];
    structures: igorpro.ReferenceItem[];
    subtypes: igorpro.ReferenceItem[];
    pragmas: igorpro.ReferenceItem[];
    hooks: igorpro.ReferenceItem[];
}

/**
 * Provider subclass that manages built-in symbols.
 */
export class SystemProvider extends Provider {
    // private activeWorkspaceFolder: vscode.WorkspaceFolder | undefined;

    constructor(context: vscode.ExtensionContext) {
        super(context);

        // load the API reference file
        const apiReferenceUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'igorpro.apiReference.json');
        vscode.workspace.fs.readFile(apiReferenceUri).then(uint8Array => {
            // convert JSON-formatted file contents to a javascript object.
            const apiReference: APIReference = JSON.parse(new TextDecoder('utf-8').decode(uint8Array));

            // convert the object to ReferenceMap and register the set.
            const builtinStorage: igorpro.ReferenceStorage = new Map(
                [
                    [igorpro.ReferenceItemKind.constant, new Map(Object.entries(apiReference.constants))],
                    [igorpro.ReferenceItemKind.variable, new Map(Object.entries(apiReference.variables))],
                    [igorpro.ReferenceItemKind.function, new Map(Object.entries(apiReference.functions))],
                    [igorpro.ReferenceItemKind.operation, new Map(Object.entries(apiReference.operations))],
                    [igorpro.ReferenceItemKind.keyword, new Map(Object.entries(apiReference.keywords))],
                    [igorpro.ReferenceItemKind.structure, new Map(Object.entries(apiReference.structures))],
                    [igorpro.ReferenceItemKind.subtype, new Map(Object.entries(apiReference.subtypes))],
                    [igorpro.ReferenceItemKind.pragma, new Map(Object.entries(apiReference.pragmas))],
                    [igorpro.ReferenceItemKind.hook, new Map(Object.entries(apiReference.hooks))],
                ]
            );
            this.storageCollection.set(igorpro.BUILTIN_URI, builtinStorage);
            this.updateCompletionItemsForUriString(igorpro.BUILTIN_URI);
        });
    }
}
