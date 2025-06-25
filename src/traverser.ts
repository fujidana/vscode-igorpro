import * as vscode from 'vscode';
import * as tree from './igorproTree';
import * as lang from './igorpro';

export function traverse(tree: tree.Program): [lang.ReferenceStorage, vscode.DocumentSymbol[]] {
    const constantRefMap: lang.ReferenceMap = new Map();
    // const menuRefMap: igorpro.ReferenceMap = new Map();
    const pictureRefMap: lang.ReferenceMap = new Map();
    const structureRefMap: lang.ReferenceMap = new Map();
    const macroRefMap: lang.ReferenceMap = new Map();
    const functionRefMap: lang.ReferenceMap = new Map();

    const ReferenceStorage: lang.ReferenceStorage = new Map([
        [lang.ReferenceItemKind.constant, constantRefMap],
        // [lang.ReferenceItemKind.menu, menuRefMap],
        [lang.ReferenceItemKind.picture, pictureRefMap],
        [lang.ReferenceItemKind.macro, macroRefMap],
        [lang.ReferenceItemKind.function, functionRefMap],
    ]);

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

    for (const node of tree.body) {
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

    for (const node of tree.body) {
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
    return [ReferenceStorage, symbols];
}
