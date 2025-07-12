import * as vscode from 'vscode';
import * as lang from './language';
import type { LocationRange } from './parser';
import type * as tree from './tree';

// NOTE: estraverse is patched to support Igor Pro specific node types.
// import * as estraverse from 'estraverse';
var estraverse = require('estraverse');

const VisitorKeys = {
    // The following nodes has the same properties for visitor keys.
    // (Other properties can be different between Igor Pro node and estree node.)
    AssignmentExpression: ['left', 'right'],
    ArrayExpression: ['elements'],
    BinaryExpression: ['left', 'right'],
    CallExpression: ['callee', 'arguments'],
    ConditionalExpression: ['test', 'consequent', 'alternate'],
    DirectiveStatement: [], // TODO: [expression] after parser is refined.
    DoWhileStatement: ['body', 'test'],
    EmptyStatement: [],
    ExpressionStatement: ['expression'],
    ForStatement: ['init', 'test', 'update', 'body'],
    ForInStatement: ['left', 'right', 'body'],
    FunctionDeclaration: ['id', 'params', 'body'], // TODO: optParams
    Identifier: [],
    Literal: [],
    MemberExpression: ['object', 'property'],
    Program: ['body'],
    ReturnStatement: ['argument'],
    SwitchStatement: ['discriminant', 'cases'],
    SwitchCase: ['test', 'consequent'],
    UnaryExpression: ['argument'],
    UpdateExpression: ['argument'],
    VariableDeclaration: ['declarations'],

    // The following nodes have the same name as estree nodes
    // but have different properties for visitor keys.
    BreakStatement: [], // ['label'],
    ContinueStatement: [], // ['label'],
    IfStatement: ['cases'], // ['test', 'consequent', 'alternate'],
    SequenceExpression: ['expressions'],
    TryStatement: ['block', 'handler'], // ['block', 'handler', 'finalizer'],
    VariableDeclarator: [], // ['id', 'init'], // TODO

    // The following nodes are original ones for Igor Pro node types.
    UnclassifiedStatement: [],
    ConstantDeclaration: ['id'],
    MenuDeclaration: ['id', 'body'],
    SubmenuDeclaration: ['id', 'body'],
    MenuItemStatement: [],
    PictureDeclaration: ['id', 'body'],
    Ascii85Block: [],
    StructureDeclaration: ['id', 'body'],
    StructureMemberDeclaration: ['flags', 'declarations'],
    StructureMemberDeclarator: ['id'],
    MacroDeclaration: ['id', 'params', 'body'],
    IfCase: ['test', 'consequent'],
    BundledStatement: ['body'],
    OperationStatement: ['flags'], // TODO
    EmptyExpression: [],
    ReferenceExpression: ['arguments'],
    PathExpression: ['body'],
    ArrayElement: ['object', 'index'],
    ArrayElementExpression: ['object', 'indexes'],
    WaveRange: ['start', 'end', 'increment'],
    WaveIndex: ['index'],
    WaveDimLabel: ['label'],
    Flag: ['value'],
};

export function traverse(program: tree.Program): [lang.ReferenceStorage, vscode.DocumentSymbol[]] {

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

    const symbols = new Array<vscode.DocumentSymbol>();
    let parentSymbol: vscode.DocumentSymbol | undefined;

    estraverse.traverse(program, {
        enter: (node: tree.Node, parent: tree.Node | null) => {
            // console.log(node.type, parent?.type);
            if (!parent) {
                // node.type === 'program'. Just continue.
            } else if (parent.type === 'Program') {
                let symbol: vscode.DocumentSymbol | undefined;

                if (node.type === 'ConstantDeclaration') {
                    const refItem = makeRefItem(node);
                    refItem.static = node.static;
                    constantRefMap.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Constant)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'MenuDeclaration') {
                    // menuRefMap.set(node.id.name.toLowerCase(), makeRefItem(node));

                    if ((symbol = getMenuSymbol(node)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'PictureDeclaration') {
                    const refItem = makeRefItem(node);
                    refItem.static = node.static;
                    pictureRefMap.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Object)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'StructureDeclaration') {
                    const refItem = makeRefItem(node);
                    refItem.static = node.static;
                    structureRefMap.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Struct)) !== undefined) {
                        for (const subnode of node.body) {
                            if (subnode.type === 'StructureMemberDeclaration') {
                                symbol.children.push(...getDeclaratorSymbols(subnode));
                            }
                        }
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'MacroDeclaration') {
                    const refItem = makeRefItem(node);
                    refItem.signature = makeSignatureForMacroAndFunc(node);
                    macroRefMap.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Method)) !== undefined) {
                        symbols.push(symbol);
                    }
                    parentSymbol = symbol;
                } else if (node.type === 'FunctionDeclaration') {
                    const refItem = makeRefItem(node);
                    refItem.static = node.static;
                    refItem.signature = makeSignatureForMacroAndFunc(node);
                    functionRefMap.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Function)) !== undefined) {
                        symbols.push(symbol);
                    }
                    parentSymbol = symbol;
                }
            } else if (parentSymbol) {
                if (node.type === 'VariableDeclaration') {
                    parentSymbol.children.push(...getDeclaratorSymbols(node));
                    return estraverse.VisitorOption.Skip;
                } else if (
                    node.type === 'DoWhileStatement' ||
                    node.type === 'ForStatement' ||
                    node.type === 'ForInStatement' ||
                    node.type === 'SwitchStatement' ||
                    node.type === 'SwitchCase' ||
                    node.type === 'IfStatement' ||
                    node.type === 'TryStatement' ||
                    node.type === 'BundledStatement'
                ) {
                    // dig deeper into the children nodes of the statement.
                } else {
                    return estraverse.VisitorOption.Skip;
                }
            }
        },
        leave: (node: tree.Node, parent: tree.Node | null) => {
            if (!parent) {
                // node.type === 'program'. Just continue.
            } else if (parent.type === 'Program') {
                if (node.type === 'MacroDeclaration' || node.type === 'FunctionDeclaration') {
                    // reset parentSymbol after leaving a function declaration.
                    parentSymbol = undefined;
                }
            }
        },
        keys: VisitorKeys,
    });

    return [ReferenceStorage, symbols];

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

    function getSymbol(node: tree.ParentDeclaration | tree.SubmenuDeclaration | tree.StructureMemberDeclarator, kind: vscode.SymbolKind) {
        if (node.loc && node.id.loc) {
            return new vscode.DocumentSymbol(node.id.name, '', kind, lang.convertRange(node.loc), lang.convertRange(node.id.loc));
        } else {
            console.log(`Missing location for node: ${node.type} ${node.id.name}`);
        }
    }

    function getMenuSymbol(node: tree.MenuDeclaration | tree.SubmenuDeclaration) {
        const symbol = getSymbol(node, vscode.SymbolKind.Event);
        if (symbol) {
            for (const subnode of node.body) {
                if (subnode.type === 'SubmenuDeclaration') {
                    const subsymbol = getMenuSymbol(subnode);
                    if (subsymbol) {
                        symbol.children.push(subsymbol);
                    }
                }
            }
            return symbol;
        }
    }

    function getStructureSymbol(node: tree.StructureDeclaration) {
        const symbol = getSymbol(node, vscode.SymbolKind.Struct);
        if (symbol) {
            for (const subnode of node.body) {
                if (subnode.type === 'StructureMemberDeclaration') {
                    symbol.children.push(...getDeclaratorSymbols(subnode));
                }
            }
            return symbol;
        }
    }

    function getDeclaratorSymbols(node: tree.VariableDeclaration | tree.StructureMemberDeclaration): vscode.DocumentSymbol[] {
        const kind = node.type === 'VariableDeclaration' ? vscode.SymbolKind.Variable : vscode.SymbolKind.Field;
        const symbols: vscode.DocumentSymbol[] = [];
        node.declarations.forEach(declarator => {
            if (declarator.loc && declarator.id.loc) {
                symbols.push(new vscode.DocumentSymbol(declarator.id.name, '', kind, lang.convertRange(declarator.loc), lang.convertRange(declarator.id.loc)));
            } else {
                console.log(`Missing location for declarator node: ${declarator.type} ${declarator.id.name}`);
            }
        });
        return symbols;
    }
}
