// Type Definitions for Igor Procedure File (*.ipf) syntax tree.
//
// The extension author borrowed the naming convention of nodes from estree.
// However, owing to the grammatical difference between JavaScript and Igor Pro,
// the definisions are quit different.



import type { DiagnosticSeverity } from 'vscode';
import type { LocationRange } from './grammar';

interface BaseNodeWithoutComments {
    type: string;
    loc?: LocationRange;
}

/** 
 * Unlike ESTree, `trailingComment` is not an array (and not `trailingComments`).
 */
interface BaseNode extends BaseNodeWithoutComments {
    leadingComments?: Comment[];
    trailingComment?: Comment;
}

interface NodeMap {
    Program: Program;

    ParentStatement: ParentStatement;

    // ChildStatement: ChildStatement;
    InMenuStatement: InMenuStatement;
    InPictureStatement: InPictureStatement;
    InStructureStatement: InStructureStatement;
    InFunctionStatement: InFunctionStatement;

    StructureMemberDeclarator: StructureMemberDeclarator;

    IfCase: IfCase;
    SwitchCase: SwitchCase;
    VariableDeclarator: VariableDeclarator;

    Expression: Expression;

    SequenceExpression: SequenceExpression;
    WaveRange: WaveRange;
    WaveIndex: WaveIndex;
    WaveDimLabel: WaveDimLabel;
    Flag: Flag;
}

export type Node = NodeMap[keyof NodeMap];

// export type ChildStatement = InMenuStatement | InPictureStatement | InStructureStatement | InFunctionStatement;

export interface Comment extends BaseNodeWithoutComments {
    type: 'Line' | 'Block'; // Block comment is not supported.
    value: string;
}

export interface BaseBlock extends BaseStatement {
    innerComments?: Comment[];
}

export interface Problem extends BaseNode {
    message: string;
    severity: DiagnosticSeverity;
    loc: LocationRange;
}

export interface Program extends BaseNode {
    type: 'Program';
    body: ParentStatement[];
    problems: Problem[];
}

export interface BaseStatement extends BaseNode { }

export type ParentStatement =
    | DirectiveStatement
    | ParentDeclaration
    | EmptyStatement
    | UnclassifiedStatement;

export type ParentDeclaration =
    | ConstantDeclaration
    | MenuDeclaration
    | PictureDeclaration
    | StructureDeclaration
    | MacroDeclaration
    | FunctionDeclaration;

export type InMenuStatement =
    | SubmenuDeclaration
    | MenuItemStatement
    | MenuHelpStatement
    | EmptyStatement
    | UnclassifiedStatement;

export type InPictureStatement =
    | Ascii85Block
    | EmptyStatement
    | UnclassifiedStatement;

export type InStructureStatement =
    | StructureMemberDeclaration
    | EmptyStatement
    | UnclassifiedStatement;

export type InFunctionStatement =
    | DirectiveStatement
    | IfStatement
    | SwitchStatement
    | TryStatement
    | DoWhileStatement
    | ForStatement
    | ForInStatement
    | BreakStatement
    | ContinueStatement
    | BundledStatement
    | ReturnStatement
    | VariableDeclaration
    // | AssignmentStatement
    | OperationStatement
    | ExpressionStatement
    | EmptyStatement
    | UnclassifiedStatement;


/** *
 * A statement that include multiple statement using ";" as a separator.
 */
export interface BundledStatement extends BaseStatement {
    type: 'BundledStatement';
    body: BundlableStatement[];
}

/**
 * A set of statement executable in a single line with or without ";" 
 * as a separator.
 *
 * This is a subset of `InFunctionStatement`. It looks statements in this
 * list except `ReturnStatement` can be executed in the command window.
 */
type BundlableStatement =
    | ReturnStatement
    | VariableDeclaration
    // | AssignmentStatement
    | OperationStatement
    | ExpressionStatement
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

export interface UnclassifiedStatement extends BaseStatement {
    type: 'UnclassifiedStatement';
    value: string;
}

/** 
 * Compiler directives such as `#pragma` and `#define.
 * 
 * While `Directive` in ESTree is a type of `ExpressionStatement`,
 * this is a kind of independent statement.
 * TODO: parse the expression.
 * TODO: make subtype for `#if`, `#ifdef` and `#ifndef`.
 */
export interface DirectiveStatement extends BaseStatement {
    type: 'DirectiveStatement';
    directive: string;
    expression?: string;
}

// constant

/**
 * Constant declarations such as `Constant kNum = 0`, `Constant/C kCmplx = (1, 2)` and `StrConstant kStr = "abc"`.
 * 
 * While the constant declaration in ESTree such as `const a = 1` is a kind of `VariableDeclaration`,
 * that in Igor pro is a top-level statement and different from the variable declaration such as `Variable a`.
 */
export interface ConstantDeclaration extends BaseStatement {
    type: 'ConstantDeclaration';
    id: Identifier;
    kind: 'number' | 'string' | 'complex';
    override: boolean;
    static: boolean;
    value: number | string | [number, number] | null;
    raw: string;
}

// menu

export interface BaseMenu extends BaseBlock {
    id: StringIdentifier;
    body: InMenuStatement[];
}

export interface MenuDeclaration extends BaseMenu {
    type: 'MenuDeclaration';
    dynamic?: boolean;
    hideable?: boolean;
    contextualmenu?: boolean;
}

export interface SubmenuDeclaration extends BaseMenu {
    type: 'SubmenuDeclaration';
}

export interface MenuItemStatement extends BaseStatement {
    type: 'MenuItemStatement';
    label: StringIdentifier | Expression;
    quite: boolean;
    execution: BundledStatement | BundlableStatement;
}

export interface MenuHelpStatement extends BaseStatement {
    type: 'MenuHelpStatement';
    messages: Expression[];
}

// picture

export interface PictureDeclaration extends BaseBlock {
    type: 'PictureDeclaration';
    id: StrictIdentifier;
    static: boolean;
    body: InPictureStatement[];
}

export interface Ascii85Block extends BaseBlock {
    type: 'Ascii85Block';
    // data?: Uint8Array;
    raw: string[];
}

// structure

export interface StructureDeclaration extends BaseBlock {
    type: 'StructureDeclaration';
    id: StrictIdentifier;
    static: boolean;
    body: InStructureStatement[];
}

export interface StructureMemberDeclaration extends BaseStatement {
    type: 'StructureMemberDeclaration';
    kind: 'char' | 'uchar' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'int64' | 'uint64' | 'float' | 'double' | 'variable' | 'string' | 'nvar' | 'svar' | 'dfref' | 'struct' | 'funcref';
    proto?: string; // used for structureName of 'struct' member and protoFunc of 'funcref'
    flags?: Flag[];
    declarations: StructureMemberDeclarator[];
}

export interface StructureMemberDeclarator extends BaseStatement {
    type: 'StructureMemberDeclarator';
    id: StrictIdentifier | LiberalIdentifier;
    size?: string; // TODO: convert to integer or expression
}

// function and macro

export interface BaseFunction extends BaseBlock {
    id: StrictIdentifier;
    params: (Identifier | VariableDeclaration | EmptyExpression)[]
    body: InFunctionStatement[];
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
    return: any; // TODO: type is incorrect.
}

export interface IfStatement extends BaseBlock {
    type: 'IfStatement';
    cases: IfCase[];
}

export interface IfCase extends BaseBlock {
    type: 'IfCase';
    test?: Expression;
    consequent: InFunctionStatement[];
}

export interface SwitchStatement extends BaseBlock {
    type: 'SwitchStatement';
    kind: 'number' | 'string';
    discriminant: Expression;
    cases: SwitchCase[];
}

export interface SwitchCase extends BaseBlock {
    type: 'SwitchCase';
    test?: Expression;
    consequent: InFunctionStatement[]; //(InFunctionStatement | BreakStatement)[];
}

export interface TryStatement extends BaseBlock {
    type: 'TryStatement';
    block: InFunctionStatement[];
    handler: InFunctionStatement[];
}

export interface DoWhileStatement extends BaseBlock {
    type: 'DoWhileStatement';
    body: InFunctionStatement[]; // (InFunctionStatement | BreakStatement | ContinueStatement)[];
    test: Expression;
}

export interface ForStatement extends BaseBlock {
    type: 'ForStatement';
    init: SequenceExpression | Expression | null; // TODO: Inaccurate.
    test: Expression;
    update: SequenceExpression | Expression | null; // TODO: Inaccurate.
    body: InFunctionStatement[]; // (InFunctionStatement | BreakStatement | ContinueStatement)[];
}

export interface ForInStatement extends BaseBlock {
    type: 'ForInStatement';
    left: Expression;
    right: Expression;
    body: InFunctionStatement[]; // (InFunctionStatement | BreakStatement | ContinueStatement)[];
}

export interface BreakStatement extends BaseStatement {
    type: 'BreakStatement';
}

export interface ContinueStatement extends BaseStatement {
    type: 'ContinueStatement';
}

export interface ReturnStatement extends BaseStatement {
    type: 'ReturnStatement';
    argument: Expression | null;
}

export interface VariableDeclaration extends BaseStatement {
    type: 'VariableDeclaration';
    kind: string; // TODO: literal types.
    proto?: string; // protoFunc for 'funcref' and structureName for 'struct'
    flags: Flag[];
    declarations: VariableDeclarator[];
}

export interface VariableDeclarator extends BaseNode {
    type: 'VariableDeclarator';
    id: Identifier; // Identifier | PathExpression;
    init: Expression | null; // TODO: type not yet given
    pbr?: boolean; // pass-by-reference
}

// TODO: finer parsing.
export interface OperationStatement extends BaseStatement {
    type: 'OperationStatement';
    name: string;
    flags: Flag[];
    expression: string;
}

/**
 * Only expressions of update, function call, and assignment can be used as a statement.
 */
export interface ExpressionStatement extends BaseStatement {
    type: 'ExpressionStatement';
    expression: AssignmentExpression | UpdateExpression | CallExpression;
    multiThread?: boolean; // only for assignment expressions
    flags?: Flag[]; // only for assignment expressions
}

// expression

export interface BaseExpression extends BaseNode { }

export interface ExpressionMap {
    AssignmentExpression: AssignmentExpression;
    ArrayExpression: ArrayExpression;
    ReferenceExpression: ReferenceExpression;
    BinaryExpression: BinaryExpression;
    ConditionalExpression: ConditionalExpression;
    UnaryExpression: UnaryExpression;
    UpdateExpression: UpdateExpression;
    CallExpression: CallExpression;
    MemberExpression: MemberExpression;
    PathExpression: PathExpression;
    ArrayElementExpression: ArrayElementExpression;
    ArrayElement: ArrayElement;
    Identifier: Identifier;
    // WaveRange: WaveRange;
    // WaveIndex: WaveIndex;
    // WaveDimLabel: WaveDimLabel;
    // Flag: Flag;
}

export type Expression = ExpressionMap[keyof ExpressionMap];


type AssignmentOperator = '=' | '+=' | '-=' | '*=' | '/=' | ':=';
type BinaryOperator =
    | '&&' | '||'
    | '&' | '|' | '%^' | '%&' | '%|'
    | '==' | '!=' | '>' | '>=' | '<' | '<='
    | '+' | '-' | '*' | '/'
    | '^' | '<<' | '>>';
type UnaryOperator = '!' | '~' | '-' | '+' | '%~';
type UpdateOperator = '++' | '--';


export interface EmptyExpression extends BaseExpression {
    type: 'EmptyExpression';
}

type LValue = BaseExpression; // TODO: limit to more specific types.

// Currently appears only in `init` and `update` of `ForStatement`.
// Not a member of `Expression`.
export interface SequenceExpression extends BaseExpression {
    type: 'SequenceExpression';
    expressions: Expression[];
}

/** 
 * Assignment in Igor Pro is not a pure expression. 
 * It does not return a value.
 * For example, the following type of code is not valid:
 * ```igorpro
 * if ((ind = indexDir(...)) != -1) 
 *     // if index is found, do something
 * endif
 * ```
 * 
 * This can be used at a few limited situations:
 * - independent statement.
 * - initialization of a variable such as `for (i = 0; ...)`.
 * - optional parameter in a function such as `Function a(b = 1)`.
 *   (if it can be regarded as assignment).
 */
export interface AssignmentExpression extends BaseExpression {
    type: 'AssignmentExpression';
    left: LValue;
    right: Expression;
    operator: AssignmentOperator;
}

export interface ArrayExpression extends BaseExpression {
    type: 'ArrayExpression';
    elements: Expression[];
    kind: 'brace' | 'bracket' | 'parenthesis'; // `{}` | `[]` | `()`
}

export interface ReferenceExpression extends BaseExpression {
    type: 'ReferenceExpression';
    argument: Expression;
}

export interface BinaryExpression extends BaseExpression {
    type: 'BinaryExpression';
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
}

export interface ConditionalExpression extends BaseExpression {
    type: 'ConditionalExpression';
    test: Expression;
    alternate: Expression;
    consequent: Expression;
}

export interface UnaryExpression extends BaseExpression {
    type: 'UnaryExpression';
    operator: UnaryOperator;
    argument: Expression;
}

export interface UpdateExpression extends BaseExpression {
    type: 'UpdateExpression';
    operator: UpdateOperator;
    argument: Identifier;
    prefix: boolean;
}

export interface CallExpression extends BaseExpression {
    type: 'CallExpression';
    callee: Expression; // Identifier;
    modules: string[]; // TODO: parse module names
    arguments: (Expression | AssignmentExpression)[];
}

export interface MemberExpression extends BaseExpression {
    type: 'MemberExpression';
    object: Expression;
    property: Expression;
}

export interface PathExpression extends BaseExpression {
    type: 'PathExpression';
    body: (ReferenceExpression | Identifier | null)[];
}

// TODO: type not well designed.
export interface ArrayElementExpression extends BaseExpression {
    type: 'ArrayElementExpression';
    object: Expression;
    indexes: (WaveRange | WaveIndex)[];
}

// TODO: type not well designed.
export interface ArrayElement extends BaseExpression {
    type: 'ArrayElement';
    object: Identifier;
    index: Expression;
}

export interface Literal extends BaseExpression {
    type: 'Literal';
    value: string | number;
    raw: string;
}

export type Identifier = StrictIdentifier | LiberalIdentifier | StringIdentifier;

interface BaseIdentifier extends BaseExpression {
    type: 'Identifier';
    kind: 'strict' | 'liberal' | 'string'
    name: string;
}

export interface StrictIdentifier extends BaseIdentifier {
    kind: 'strict';
}

export interface LiberalIdentifier extends BaseIdentifier {
    kind: 'liberal';
}

export interface StringIdentifier extends BaseIdentifier {
    kind: 'string';
}

// TODO: type not well designed.
export interface WaveRange extends BaseNode {
    type: 'WaveRange';
    start: Expression | WaveDimLabel;
    end: Expression | WaveDimLabel;
    increment: Expression | WaveDimLabel | null;
    scaled?: boolean;
}

// TODO: type not well designed.
export interface WaveIndex extends BaseNode {
    type: 'WaveIndex';
    index: Expression | WaveDimLabel;
    scaled?: boolean;
}

// TODO: type not well designed.
export interface WaveDimLabel extends BaseNode {
    type: 'WaveDimLabel';
    label: Expression;
}

export interface Flag extends BaseNode {
    type: 'Flag';
    key: string;
    value?: Expression;
}
