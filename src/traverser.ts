import * as vscode from 'vscode';
import * as lang from './language';
import type * as tree from './tree';

// NOTE: estraverse is patched to support Igor Pro specific node types.
// import * as estraverse from 'estraverse';
var estraverse = require('estraverse');

const VISITOR_KEYS = {
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
    FunctionDeclaration: ['id', 'params', 'optParams', 'body'], // ['id', 'params', 'body']
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

export function traverseForGlobals(program: tree.Program): [lang.ReferenceBook, vscode.DocumentSymbol[]] {
    // Create variables to store data.
    const refBook: lang.ReferenceBook = new Map();
    const symbols: vscode.DocumentSymbol[] = [];;

    let parentSymbol: vscode.DocumentSymbol | undefined;

    // Traverse the syntax tree.
    estraverse.traverse(program, {
        enter: (node: tree.Node, parent: tree.Node | null) => {
            // console.log(node.type, parent?.type);
            if (!parent) {
                // node.type === 'program'. Just continue.
            } else if (parent.type === 'Program') {
                let symbol: vscode.DocumentSymbol | undefined;

                if (node.type === 'ConstantDeclaration') {
                    const refItem = makeReferenceItem(node, node.id.name, 'constant', node.static);
                    refBook.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Constant)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'MenuDeclaration') {
                    // const refItem = makeRefItem(node, 'menu');
                    // refBook.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getMenuSymbol(node)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'PictureDeclaration') {
                    const refItem = makeReferenceItem(node, node.id.name, 'picture', node.static);
                    refBook.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Object)) !== undefined) {
                        symbols.push(symbol);
                    }
                    return estraverse.VisitorOption.Skip;
                } else if (node.type === 'StructureDeclaration') {
                    const refItem = makeReferenceItem(node, node.id.name, 'structure', node.static);
                    refBook.set(node.id.name.toLowerCase(), refItem);

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
                    const signature = makeSignatureForMacroAndFunc(node);
                    const refItem = makeReferenceItem(node, signature, 'macro');
                    refBook.set(node.id.name.toLowerCase(), refItem);

                    if ((symbol = getSymbol(node, vscode.SymbolKind.Method)) !== undefined) {
                        symbols.push(symbol);
                    }
                    parentSymbol = symbol;
                } else if (node.type === 'FunctionDeclaration') {
                    const signature = makeSignatureForMacroAndFunc(node);
                    const refItem = makeReferenceItem(node, signature, 'function', node.static);
                    refBook.set(node.id.name.toLowerCase(), refItem);

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
        keys: VISITOR_KEYS,
    });

    return [refBook, symbols];

    function makeSignatureForMacroAndFunc(node: tree.FunctionDeclaration | tree.MacroDeclaration): string {
        let signature = node.id.name;

        signature += '(' + node.params.map(param => {
            if (param.type === 'Identifier') {
                return param.name;
            } else if (param.type === 'VariableDeclaration') {
                let tmpStr = param.kind;
                if (param.flags) {
                    tmpStr += param.flags.map(flag => '/' + flag.key).join('');
                }
                tmpStr += ' ' + param.declarations.map(decl => decl.id.name).join(', ');
                return tmpStr;
            } else {
                return '';
            }
        }).join(', ');

        if (node.type === 'FunctionDeclaration' && node.optParams) {
            if (node.params.length > 0) {
                signature += ', ';
            }
            signature += '[' + node.optParams.map(param => {
                if (param.type === 'Identifier') {
                    return param.name;
                } else if (param.type === 'VariableDeclaration') {
                    let tmpStr = param.kind;
                    if (param.flags) {
                        tmpStr += param.flags.map(flag => '/' + flag.key).join('');
                    }
                    tmpStr += ' ' + param.declarations.map(decl => decl.id.name).join(', ');
                    return tmpStr;
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

export function traverseForLocals(program: tree.Program, position: vscode.Position): lang.ReferenceBook {
    // Create variables to store data.
    const refBook: lang.ReferenceBook = new Map();

    // Traverse the syntax tree.
    estraverse.traverse(program, {
        enter: (node: tree.Node, parent: tree.Node | null) => {
            // console.log('enter', node.type, parent?.type);

            if (parent === null && node.type === 'Program') {
                // if it is a top-level, dig in.
                return;
            } else if (node.type === 'ConstantDeclaration' || node.type === 'MenuDeclaration' || node.type === 'PictureDeclaration' || node.type === 'StructureDeclaration') {
                return estraverse.Skip;
            } else if (!node.loc) {
                console.log('Statement should have location. This may be a bug in the parser.');
                return;
            }

            const nodeRange = lang.convertRange(node.loc);

            if (nodeRange.end.isAfter(position)) {
                return estraverse.Break;
            } else if (node.type === 'FunctionDeclaration' || node.type === 'MacroDeclaration') {
                if (nodeRange.end.isBefore(position)) {
                    return estraverse.VisitorOption.Skip;
                } else if (nodeRange.contains(position)) {
                    refBook.clear();
                }
            } else if (node.type === 'VariableDeclaration') {
                for (const declarator of node.declarations) {
                    const refItem = makeReferenceItem(declarator, declarator.id.name, 'variable');
                    refBook.set(declarator.id.name.toLowerCase(), refItem);
                }
            } else if (node.type === 'OperationStatement' && node.name.toLowerCase() === 'make') {
                for (const arg of node.args) {
                    if (arg.type === 'Identifier') {
                        const refItem = makeReferenceItem(arg, arg.name, 'variable');
                        refBook.set(arg.name.toLowerCase(), refItem);
                    } else if (arg.type === 'AssignmentExpression' && arg.left.type === 'Identifier') {
                        const refItem = makeReferenceItem(arg, arg.left.name, 'variable');
                        refBook.set(arg.left.name.toLowerCase(), refItem);
                    }
                }
            }
        },
        // leave: (node, parent) => {
        //     console.log('leave', node.type, parent?.type);
        // },
        keys: VISITOR_KEYS,
    });

    return refBook;
}


function makeReferenceItem(node: tree.Node, signature: string, category: lang.ReferenceCategory, isStatic?: boolean): lang.ReferenceItem {
    const description = node.leadingComments ?
        node.leadingComments.map(comment => comment.value).join('\n') :
        undefined;
    if (isStatic !== undefined) {
        return { signature, category, description, isStatic, location: node.loc, };
    } else {
        return { signature, category, description, location: node.loc, };
    }
}
