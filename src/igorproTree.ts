// Type Definitions for Igor Procedure File (*.ipf) syntax tree.
//
// The extension author borrowed the naming convention of nodes from estree.
// However, owing to the grammatical difference between JavaScript and Igor Pro,
// the definisions are quit different.


/*
{
    "returnTypes": {
}
        "Program": "tree.Program",
        "_0_": "string",
        "_1_": "string",
        "Eol": "void",
        "Eof": "void",
        "Comment": "tree.Comment",
        "EolWWOComment": "tree.Comment | undefined",
        "EosWWOComment": "tree.Comment | undefined",
        "EosLA": "void",
        "StringLiteral": "string",
        "StringId": "tree.Identifier",
        "ShortName": "string",
        "ShortId": "tree.Identifier",
        "LiberalName": "string",
        "LiberalId": "tree.Identifier",
        "TLStmt": "tree.TopLevelStatement",
        "EmptyEolStmt": "tree.EmptyStatement",
        "EmptyStmtWLComments": "tree.EmptyStatement",
        "UnclassifiedEolStmt": "tree.UnclassifiedStatement",
        "End": "[string, FileRange]",
        "Directive": "tree.Directive",
        "TLDecl": "tree.TopLevelDeclaration",
        "ConstDecl": "tree.ConstantDeclaration",
        "MenuDecl": "tree.MenuDeclaration",
        "PictDecl": "tree.PictureDeclaration",
        "StructDecl": "tree.StructureDeclaration",
        "MacroDecl": "tree.MacroDeclaration",
        "FuncDecl": "tree.FunctionDeclaration",
        "MenuStmt": "tree.MenuStatement",
        "PictStmt": "tree.PictureStatement",
        "StructStmt": "tree.StructureStatement",
        "FuncStmt": "tree.FunctionStatement",
        "SubmenuDecl": "tree.SubmenuDeclaration",
        "MenuItemStmt": "tree.MenuItemStatement",
        "Ascii85Block": "tree.Ascii85Block",
        "StructMemberDecl": "tree.StructureMemberDeclaration",
        "StructMemberDeclr": "tree.StructureMemberDeclarator"

*/

import * as vscode from 'vscode';
import type { Location, LocationRange } from './grammar';

// interface FilePosition {
//     offset: number;
//     line: number;
//     column: number;
// }

// interface FileRange {
//     start: FilePosition;
//     end: FilePosition;
//     source: string;
// }


export interface BaseNode {
    type: string;
    loc?: LocationRange;
}

export interface BaseStatement extends BaseNode {
    leadingComments?: Comment[];
    trailingComment?: Comment;
}

export interface BaseBlock extends BaseStatement {
    interceptingComment?: Comment;
}


export interface Problem {
    message: string;
    severity: vscode.DiagnosticSeverity;
    loc: LocationRange;
}

// export type Node = NodeMap[keyof NodeMap];

export interface Comment extends BaseNode {
    type: 'Line';
    value: string;
}

export interface Program extends BaseNode {
    type: 'Program';
    body: TopLevelStatement[];
    problems: Problem[];
}

export type TopLevelStatement =
    | Directive
    | TopLevelDeclaration
    | EmptyStatement
    | UnclassifiedStatement;

export type TopLevelDeclaration =
    | ConstantDeclaration
    | MenuDeclaration
    | PictureDeclaration
    | StructureDeclaration
    | MacroDeclaration
    | FunctionDeclaration;

export type MenuStatement =
    | MenuItemStatement
    | SubmenuDeclaration
    | EmptyStatement
    | UnclassifiedStatement;

export type PictureStatement =
    | Ascii85Block
    | EmptyStatement
    | UnclassifiedStatement;

export type StructureStatement =
    | StructureMemberDeclaration
    | EmptyStatement
    | UnclassifiedStatement;

export type FunctionStatement =
    | EmptyStatement
    | UnclassifiedStatement;

export interface EmptyStatement extends BaseStatement {
    type: 'EmptyStatement';
}

// export type Declaration =
//     | ConstantDeclaration
//     | MenuDeclaration
//     | SubmenuDeclaration
//     | PictureDeclaration
//     | StructureDeclaration
//     | MacroDeclaration
//     | FunctionDeclaration;

export interface Directive extends BaseStatement {
    type: 'Directive';
    id: Identifier;
}


export interface UnclassifiedStatement extends BaseStatement {
    type: 'UnclassifiedStatement';
    value: string;
}

// constant

export interface ConstantDeclaration extends BaseStatement {
    type: 'ConstantDeclaration';
    id: Identifier;
    kind: 'number' | 'string' | 'complex';
    override: boolean;
    static: boolean;
    value: number | string | [number, number];
}

// menu

export interface BaseMenu extends BaseBlock {
    id: StringIdentifier;
    options: string[];
    body: MenuStatement[];
}

export interface MenuDeclaration extends BaseMenu {
    type: 'MenuDeclaration';
}

export interface SubmenuDeclaration extends BaseMenu {
    type: 'SubmenuDeclaration';
}

export interface MenuItemStatement extends BaseBlock {
    // TODOS: parse menu item later.
    type: 'MenuItemStatement';
    value: string;
}

// picture

export interface PictureDeclaration extends BaseBlock {
    type: 'PictureDeclaration';
    id: StrictIdentifier;
    static: boolean;
    body: PictureStatement[];
}

export interface Ascii85Block extends BaseBlock {
    type: 'Ascii85Block';
    data: string[]
}

// structure

export interface StructureDeclaration extends BaseBlock {
    type: 'StructureDeclaration';
    id: StrictIdentifier;
    static: boolean;
    body: StructureStatement[];
}

export interface StructureMemberDeclaration extends BaseStatement {
    type: 'StructureMemberDeclaration';
    kind: 'char' | 'uchar' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'int64' | 'uint64' | 'float' | 'double' | 'variable' | 'string' | 'nvar' | 'svar' | 'dfref' | 'struct' | 'funcref';
    proto?: string; // used for structureName of 'struct' member and protoFunc of 'funcref'
    flag?: string[];
    declarations: [StructureMemberDeclarator];
}

export interface StructureMemberDeclarator extends BaseStatement {
    type: 'StructureMemberDeclarator';
    id: StrictIdentifier | LiberalIdentifier;
    size?: string; // TODOS: convert to integer or expression
}

// function and macro

export interface BaseFunction extends BaseBlock {
    id: StrictIdentifier;
    params: (Identifier | VariableDeclaration | EmptyExpression)[]
    body: FunctionStatement[];
    subtype?: string;
}

export interface MacroDeclaration extends BaseFunction {
    type: 'MacroDeclaration';
    kind: 'macro' | 'window' | 'proc';
}

export interface FunctionDeclaration extends BaseFunction {
    type: 'FunctionDeclaration';
    optParams?: (Identifier | VariableDeclaration | EmptyExpression)[]
    threadsafe: boolean;
    override: boolean;
    static: boolean;
    return: string;
}

export interface BaseExpression extends BaseNode { }

export interface Identifier extends BaseExpression {
    type: 'Identifier';
    kind: 'strict' | 'liberal' | 'string'
    name: string;
}

export interface StrictIdentifier extends Identifier {
    kind: 'strict';
}

export interface LiberalIdentifier extends Identifier {
    kind: 'liberal';
}

export interface StringIdentifier extends Identifier {
    kind: 'string';
}

// export interface ExpressionMap {
//     Identifier: Identifier;
// }

// export type Expression = ExpressionMap[keyof ExpressionMap];

export interface IfStatement extends BaseStatement {
    type: 'IfStatement';
    cases: IfCase[];
}

export interface IfCase extends BaseBlock {
    type: 'IfCase';
    test?: BaseExpression;
    consequent: FunctionStatement[];
}

export interface SwitchStatement extends BaseBlock {
    type: 'SwitchStatement';
    kind: 'number' | 'string';
    discriminant: BaseExpression;
    cases: SwitchCase[];
}

interface SwitchCase extends BaseBlock {
    type: 'SwitchCase';
    test?: BaseExpression;
    consequent: FunctionStatement[] | BreakStatement ;
}

interface TryStatement extends BaseBlock {
    type: 'TryStatement';
    block: FunctionStatement[];
    handler: FunctionStatement[];
}

interface DoWhileStatement extends BaseBlock {
    type: 'DoWhileStatement';
    body: FunctionStatement[] | BreakStatement | ContinueStatement;
    test: BaseExpression;
}

interface ForStatement extends BaseBlock {
    type: 'ForStatement';
    init: BaseExpression | null; // Inaccurate. Actually comma-separated expressions can be accepted.
    test: BaseExpression;
    update: BaseExpression | null; // Inaccurate. Actually comma-separated expressions can be accepted.
    body: FunctionStatement[] | BreakStatement | ContinueStatement;
}

interface ForInStatement extends BaseBlock {
    type: 'ForInStatement';
    left: BaseExpression;
    right: BaseExpression;
    body: FunctionStatement[] | BreakStatement | ContinueStatement;
}

interface BreakStatement extends BaseStatement {
    type: 'BreakStatement';
}

interface ContinueStatement extends BaseStatement {
    type: 'ContinueStatement';
}

interface ReturnStatement extends BaseStatement {
    type: 'ReturnStatement';
    arguments: BaseExpression | null;
}


interface CallExpression extends BaseExpression {
    type: 'CallExpression';
    callee: BaseExpression;
    arguments: string;
    // arguments: BaseExpression[];
}

interface Literal extends BaseExpression {
    type: 'Literal';
    value: string | number;
    raw: string;
}

interface EmptyExpression extends BaseExpression {
    type: 'EmptyExpression';
}

interface VariableDeclaration extends BaseStatement {
    type: 'VariableDeclaration';
    kind: string;
    proto?: string;
    option: string[];
    declarations: VariableDeclarator[];
}

interface VariableDeclarator extends BaseStatement {
    type: 'VariableDeclarator';
    id: string;
    init: any; // TODOS: type not yet given
    pbr?: boolean; // pass-by-reference
}
