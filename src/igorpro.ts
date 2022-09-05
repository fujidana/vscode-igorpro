import * as vscode from 'vscode';

export const IPF_SELECTOR = { language: 'igorpro' };
// export const IPF_SELECTOR = [{ scheme: 'file', language: 'igorpro' }, { scheme: 'untitled', language: 'igorpro' }];
export const BUILTIN_URI = 'igorpro://system/built-in.md';

export const enum ReferenceItemKind {
    undefined = 0,
    constant,
    variable,
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
                iconIdentifier: 'symbol-module',
                completionItemKind: vscode.CompletionItemKind.Module,
                symbolKind: vscode.SymbolKind.Module
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

    constructor(label: string | vscode.CompletionItemLabel, uriString: string, refItemKind: ReferenceItemKind) {
        super(label, getReferenceItemKindMetadata(refItemKind).completionItemKind);
        this.uriString = uriString;
        this.refItemKind = refItemKind;
    };
}

export type ReferenceItem = {
    signature: string;
    description?: string;
    minimumVersion?: number;
    deprecatedMessage?: string;
    // snippet?: string;
    // location?: IFileRange;
    overloads?: {
        signature: string;
        description?: string;
    }[];
};

export type ReferenceMap = Map<string, ReferenceItem>;

export type ReferenceStorage = Map<ReferenceItemKind, ReferenceMap>;
