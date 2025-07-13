import * as vscode from 'vscode';
import type { Location, LocationRange } from './parser';

export const SELECTOR = { language: 'igorpro' };
// export const SELECTOR = [{ scheme: 'file', language: 'igorpro' }, { scheme: 'untitled', language: 'igorpro' }];

export const BUILTIN_URI = 'igorpro://built-in/built-in.md';
export const OPERATION_URI = 'igorpro://built-in/operation.md';
export const EXTRA_URI = 'igorpro://built-in/extra.md';

export const AST_URI = 'igorpro://file/ast.json';
export const ACTIVE_FILE_URI = 'igorpro://file/active-document.md';

export function convertPosition(position: Location): vscode.Position {
    return new vscode.Position(position.line - 1, position.column - 1);
}

export function convertRange(range: LocationRange): vscode.Range {
    return new vscode.Range(convertPosition(range.start), convertPosition(range.end));
}

/**
 * Map object consisting of pairs of a unique identifier and a reference item.
 */
export type ReferenceBook = Map<string, ReferenceItem>;

export type ReferenceItem = {
    readonly signature: string,
    readonly category: ReferenceCategory,
    readonly description?: string,
    readonly available?: VersionRange;
    readonly deprecated?: VersionRange;
    // snippet?: string;
    readonly location?: LocationRange;
    readonly isStatic?: boolean;
    readonly overloads?: {
        readonly signature: string;
        readonly description?: string;
    }[];
};

export type VersionRange = {
    range: string;
    description?: string;
};

const referenceCategoryNames = ['undefined', 'constant', 'variable', 'picture', 'macro', 'function', 'operation', 'keyword', 'structure', 'subtype', 'pragma', 'hook'] as const;

export type ReferenceCategory = typeof referenceCategoryNames[number];

export type ReferenceBookLike = { [K in ReferenceCategory]?: { [key: string]: Omit<ReferenceItem, 'category'> } };

type ReferenceCategoryMetadata = {
    readonly label: string
    readonly iconIdentifier: string,
    readonly completionItemKind: vscode.CompletionItemKind | undefined,
    readonly symbolKind: vscode.SymbolKind,
};

export function getVersionRangeDescription(versionRange: VersionRange, label: string) {
    let tmpStr = versionRange.range === '>=0.0.0' ? `[${label} at some time]` : `[${label}: \`${versionRange.range}\`]`;
    if (versionRange.description) {
        tmpStr += ' ' + versionRange.description;
    }
    return tmpStr;
}

export const referenceCategoryMetadata: { readonly [K in ReferenceCategory]: ReferenceCategoryMetadata } = {
    constant: {
        label: "constant",
        iconIdentifier: 'symbol-constant',
        completionItemKind: vscode.CompletionItemKind.Constant,
        symbolKind: vscode.SymbolKind.Constant
    },
    variable: {
        label: "variable",
        iconIdentifier: 'symbol-variable',
        completionItemKind: vscode.CompletionItemKind.Variable,
        symbolKind: vscode.SymbolKind.Variable
    },
    picture: {
        label: "picture",
        iconIdentifier: 'symbol-misc',
        completionItemKind: vscode.CompletionItemKind.File,
        symbolKind: vscode.SymbolKind.File
    },
    macro: {
        label: "macro",
        iconIdentifier: 'symbol-method',
        completionItemKind: vscode.CompletionItemKind.Method,
        symbolKind: vscode.SymbolKind.Method
    },
    function: {
        label: "function",
        iconIdentifier: 'symbol-function',
        completionItemKind: vscode.CompletionItemKind.Function,
        symbolKind: vscode.SymbolKind.Function
    },
    operation: {
        label: "operation",
        iconIdentifier: 'symbol-field',
        completionItemKind: vscode.CompletionItemKind.Field,
        symbolKind: vscode.SymbolKind.Field
    },
    keyword: {
        label: "keyword",
        iconIdentifier: 'symbol-keyword',
        completionItemKind: vscode.CompletionItemKind.Keyword,
        symbolKind: vscode.SymbolKind.Key
    },
    structure: {
        label: "structure",
        iconIdentifier: 'symbol-structure',
        completionItemKind: vscode.CompletionItemKind.Struct,
        symbolKind: vscode.SymbolKind.Struct
    },
    subtype: {
        label: "subtype",
        iconIdentifier: 'symbol-interface',
        completionItemKind: vscode.CompletionItemKind.Interface,
        symbolKind: vscode.SymbolKind.Interface
    },
    pragma: {
        label: "pragma keyword",
        iconIdentifier: 'symbol-misc',
        completionItemKind: vscode.CompletionItemKind.Keyword,
        symbolKind: vscode.SymbolKind.Key
    },
    hook: {
        label: "hook function",
        iconIdentifier: 'symbol-function',
        completionItemKind: undefined,
        symbolKind: vscode.SymbolKind.Null // no corresponding value
    },
    undefined: {
        label: "unknown symbol",
        iconIdentifier: 'symbol-null',
        completionItemKind: undefined,
        symbolKind: vscode.SymbolKind.Null
    },
};

export class CompletionItem extends vscode.CompletionItem {
    readonly uriString: string;
    readonly category: ReferenceCategory;
    readonly isStatic: boolean;

    constructor(label: string | vscode.CompletionItemLabel, uriString: string, category: ReferenceCategory, isStatic: boolean) {
        super(label, referenceCategoryMetadata[category].completionItemKind);
        this.uriString = uriString;
        this.category = category;
        this.isStatic = isStatic;
    };
}

/**
 * Convert a flattened map object to a structured database made of a plain object.
 * @param refBook Map object directly containing reference items.
 * @returns Object having categories as childrens and reference items as grandchildren.
 */
export function categorizeRefBook(refBook: ReferenceBook, categories: readonly ReferenceCategory[] = referenceCategoryNames) {
    const refBookLike: ReferenceBookLike = {};
    for (const category of categories) {
        refBookLike[category] = {};
    }

    for (const [identifier, refItem] of refBook.entries()) {
        if (categories.includes(refItem.category)) {
            const refBookCategory = refBookLike[refItem.category];
            if (refBookCategory) {
                // // Simply point (not copy) without deleting "category" property.
                // refBookCategory[identifier] = refItem;
                // Copy a new object with "category" property removed. 
                refBookCategory[identifier] = (({ category, ...rest }) => rest)(refItem);
            }
        }
    }
    return refBookLike;
}

/**
 * Convert a structured database made of a plain object to flattened map object.
 * @param refBookLike Object having categories as childrens and reference items as grandchildren.
 * @param categories Categories to be converted.
 * @returns Map object directly containing reference items.
 */
export function flattenRefBook(refBookLike: ReferenceBookLike, categories: readonly ReferenceCategory[] = referenceCategoryNames): ReferenceBook {
    const refBook: ReferenceBook = new Map();
    for (const [category, refSheetLike] of Object.entries(refBookLike)) {
        if (categories.includes(category as keyof typeof refBookLike)) {
            for (const [identifier, refItemLike] of Object.entries(refSheetLike)) {
                // if (refBook.has(identifier)) {
                //     console.log(`Identifiers are duplicated!: ${identifier}`);
                // }
                const refItem: ReferenceItem = Object.assign(refItemLike, { category: category as keyof typeof refBookLike });
                refBook.set(identifier, refItem);
            }
        }
    }
    return refBook;
}
