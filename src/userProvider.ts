import * as vscode from "vscode";
import * as igorpro from "./igorpro";
import { Provider } from "./provider";

export class UserProvider extends Provider implements vscode.DocumentDropEditProvider {

    constructor(context: vscode.ExtensionContext) {
        super(context);

        context.subscriptions.push(
            vscode.languages.registerDocumentDropEditProvider(igorpro.IPF_SELECTOR, this)
        );
    }

    /**
     * Required implementation of vscode.DocumentDropEditProvider
     */
     public provideDocumentDropEdits(document: vscode.TextDocument, position: vscode.Position, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentDropEdit> {
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
                            // TODOS: This should return a full path. Currently only a file name.
                            return `#include "${lastPathComponent.substring(0, lastPathComponent.length - 4)}"\n`;
                        }
                    }
                ).join(''));
            }
        }
        return undefined;
    }
}