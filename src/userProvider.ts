import * as vscode from "vscode";
import * as igorpro from "./igorpro";
import { Provider } from "./provider";

export class UserProvider extends Provider implements vscode.DocumentSymbolProvider, vscode.DocumentDropEditProvider {

    constructor(context: vscode.ExtensionContext) {
        super(context);

        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(igorpro.IPF_SELECTOR, this),
            vscode.languages.registerDocumentDropEditProvider(igorpro.IPF_SELECTOR, this),
        );
    }

    /**
     * Required implementation of vscode.DocumentSymbolProvider
     */
     public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        if (token.isCancellationRequested) { return; }

        const results = new Array<vscode.DocumentSymbol>();
        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            let lineText = document.lineAt(lineIndex).text;
            let matches: RegExpMatchArray | null;
            if ((matches = lineText.match(/^(\s*(Static|Override)?\s*\b((?:Str)?Constant)\s*((?:\/\w+\s*)*)\s+)(\w+)/i)) !== null) {
                results.push(new vscode.DocumentSymbol(
                    matches[5], '', vscode.SymbolKind.Constant,
                    new vscode.Range(lineIndex, 0, lineIndex, lineText.length),
                    new vscode.Range(lineIndex, matches[1].length, lineIndex, matches[1].length + matches[5].length)
                ));
            } else if ((matches = lineText.match(/^(\s*(Static)?\s*\b(Structure)\s+)(\w+)\s*(?=;|\/\/|$)/)) !== null) {
                const lineIndexStart = lineIndex;
                const name = matches[4];
                const selectionRange = new vscode.Range(lineIndex, matches[1].length, lineIndex, matches[1].length + matches[4].length);
                for (lineIndex++; lineIndex < document.lineCount; lineIndex++) {
                    lineText = document.lineAt(lineIndex).text;
                    if ((matches = lineText.match(/^\s*(EndStructure)\s*(?=;|\/\/|$)/i)) !== null) {
                        results.push(new vscode.DocumentSymbol(
                            name, '', vscode.SymbolKind.Struct,
                            new vscode.Range(lineIndexStart, 0, lineIndex, lineText.length),
                            selectionRange)
                        );
                        break;
                    }
                }
            } else if ((matches = lineText.match(/\s*((Macro|Proc|Window)\s+)(\w+)\s*(\()((?:(?!\/\/|\)).)*)(\))(?:\s*(:)\s*(\w+))?\s*(?=;|\/\/|$)/i)) !== null) {
                const lineIndexStart = lineIndex;
                const name = matches[3];
                const detail = matches[8] ? matches[8] : '';
                const selectionRange = new vscode.Range(lineIndex, matches[1].length, lineIndex, matches[1].length + matches[3].length);
                for (lineIndex++; lineIndex < document.lineCount; lineIndex++) {
                    lineText = document.lineAt(lineIndex).text;
                    if ((matches = lineText.match(/^\s*(End(?:Macro)?)\s*(?=;|\/\/|$)/i)) !== null) {
                        results.push(new vscode.DocumentSymbol(
                            name, detail, vscode.SymbolKind.Module,
                            new vscode.Range(lineIndexStart, 0, lineIndex, lineText.length),
                            selectionRange)
                        );
                        break;
                    }
                }
            } else if ((matches = lineText.match(/^(\s*(ThreadSafe)?\s*\b(Static|Override)?\s*\b(Function)\b\s*(?:((?:\/\w+\s*)*)|(\[)((?:(?!\/\/|\]).)*)(\])\s*)?)(\w+)\s*(\()((?:(?!\/\/|\)).)*)(\))(?:\s*(:)\s*(\w+))?\s*(?=;|\/\/|$)/i)) !== null) {
                const lineIndexStart = lineIndex;
                const name = matches[9];
                const detail = matches[14] ? matches[14] : '';
                const selectionRange = new vscode.Range(lineIndex, matches[1].length, lineIndex, matches[1].length + matches[9].length);
                for (lineIndex++; lineIndex < document.lineCount; lineIndex++) {
                    lineText = document.lineAt(lineIndex).text;
                    if ((matches = lineText.match(/^\s*(End)\s*(?=;|\/\/|$)/i)) !== null) {
                        results.push(new vscode.DocumentSymbol(
                            name, detail, vscode.SymbolKind.Function,
                            new vscode.Range(lineIndexStart, 0, lineIndex, lineText.length),
                            selectionRange)
                        );
                        break;
                    }
                }
            }
        }
        return results;
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