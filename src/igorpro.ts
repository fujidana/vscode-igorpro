import * as vscode from 'vscode';
import { FileRange } from "./grammar";

export const SELECTOR = { language: 'igorpro' };
// export const SELECTOR = [{ scheme: 'file', language: 'igorpro' }, { scheme: 'untitled', language: 'igorpro' }];
export const BUILTIN_URI = 'igorpro://system/built-in.md';

export const enum ReferenceItemKind {
    undefined = 0,
    constant,
    variable,
    picture,
    macro,
    function,
    operation,
    keyword,
    structure,
    subtype,
    pragma,
    hook,
}

type ReferenceItemKindMetadata = { label: string, iconIdentifier: string, completionItemKind: vscode.CompletionItemKind | undefined, symbolKind: vscode.SymbolKind };

export function getReferenceItemKindMetadata(refItemKind: ReferenceItemKind) : ReferenceItemKindMetadata {
    switch (refItemKind) {
        case ReferenceItemKind.constant:
            return {
                label: "constant",
                iconIdentifier: 'symbol-constant',
                completionItemKind: vscode.CompletionItemKind.Constant,
                symbolKind: vscode.SymbolKind.Constant
            };
        case ReferenceItemKind.variable:
            return {
                label: "variable",
                iconIdentifier: 'symbol-variable',
                completionItemKind: vscode.CompletionItemKind.Variable,
                symbolKind: vscode.SymbolKind.Variable
            };
        case ReferenceItemKind.picture:
            return {
                label: "picture",
                iconIdentifier: 'symbol-misc',
                completionItemKind: vscode.CompletionItemKind.File,
                symbolKind: vscode.SymbolKind.File
            };
        case ReferenceItemKind.macro:
            return {
                label: "macro",
                iconIdentifier: 'symbol-method',
                completionItemKind: vscode.CompletionItemKind.Method,
                symbolKind: vscode.SymbolKind.Method
            };
        case ReferenceItemKind.function:
            return {
                label: "function",
                iconIdentifier: 'symbol-function',
                completionItemKind: vscode.CompletionItemKind.Function,
                symbolKind: vscode.SymbolKind.Function
            };
        case ReferenceItemKind.operation:
            return {
                label: "operation",
                iconIdentifier: 'symbol-field',
                completionItemKind: vscode.CompletionItemKind.Field,
                symbolKind: vscode.SymbolKind.Field
            };
        case ReferenceItemKind.keyword:
            return {
                label: "keyword",
                iconIdentifier: 'symbol-keyword',
                completionItemKind: vscode.CompletionItemKind.Keyword,
                symbolKind: vscode.SymbolKind.Key
            };
        case ReferenceItemKind.structure:
            return {
                label: "structure",
                iconIdentifier: 'symbol-structure',
                completionItemKind: vscode.CompletionItemKind.Struct,
                symbolKind: vscode.SymbolKind.Struct
            };
        case ReferenceItemKind.subtype:
            return {
                label: "subtype",
                iconIdentifier: 'symbol-interface',
                completionItemKind: vscode.CompletionItemKind.Interface,
                symbolKind: vscode.SymbolKind.Interface
            };
        case ReferenceItemKind.pragma:
            return {
                label: "pragma keyword",
                iconIdentifier: 'symbol-misc',
                completionItemKind: vscode.CompletionItemKind.Keyword,
                symbolKind: vscode.SymbolKind.Key
            };
            case ReferenceItemKind.pragma:
                return {
                    label: "pragma keyword",
                    iconIdentifier: 'symbol-misc',
                    completionItemKind: undefined,
                    symbolKind: vscode.SymbolKind.Null // no corresponding value
                };
            case ReferenceItemKind.hook:
                return {
                    label: "hook function",
                    iconIdentifier: 'symbol-function',
                    completionItemKind: undefined,
                    symbolKind: vscode.SymbolKind.Null // no corresponding value
                };
            case ReferenceItemKind.undefined:
                return {
                    label: "unknown symbol",
                    iconIdentifier: 'symbol-null',
                    completionItemKind: undefined,
                    symbolKind: vscode.SymbolKind.Null
                };
    }
}

export class CompletionItem extends vscode.CompletionItem {
    readonly uriString: string;
    readonly refItemKind: ReferenceItemKind;
    readonly isStatic: boolean;

    constructor(label: string | vscode.CompletionItemLabel, uriString: string, refItemKind: ReferenceItemKind, isStatic: boolean) {
        super(label, getReferenceItemKindMetadata(refItemKind).completionItemKind);
        this.uriString = uriString;
        this.refItemKind = refItemKind;
        this.isStatic = isStatic;
    };
}

export type ReferenceItem = {
    signature: string;
    description?: string;
    minimumVersion?: number;
    deprecatedMessage?: string;
    // snippet?: string;
    location?: FileRange;
    static?: boolean;
    overloads?: {
        signature: string;
        description?: string;
    }[];
};

export type ReferenceMap = Map<string, ReferenceItem>;

export type ReferenceStorage = Map<ReferenceItemKind, ReferenceMap>;


// type BaseReferenceItem = {
//     type: string;
//     signature: string;
//     description?: string;
//     minimumVersion?: number;
//     deprecatedMessage?: string;
//     // snippet?: string;
//     location?: FileRange;
//     overloads?: {
//         signature: string;
//         description?: string;
//     }[];
// };

// interface FunctionReferenceItem extends BaseReferenceItem {
//     params?: string
// }

// interface ReferenceMap2 {
//     constant?: BaseReferenceItem
//     variable?: BaseReferenceItem
//     macro?: FunctionReferenceItem
//     function?: FunctionReferenceItem
//     operation?: BaseReferenceItem
//     keyword?: BaseReferenceItem
//     structure?: BaseReferenceItem
//     subtype?: BaseReferenceItem
//     pragma?: BaseReferenceItem
//     hook?: BaseReferenceItem
// }
