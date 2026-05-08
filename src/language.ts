import * as vscode from 'vscode';
import type { Location, LocationRange } from './parser';
import type * as tree from './tree';

export const SELECTOR = { language: 'igorpro' };
// export const SELECTOR = [{ scheme: 'file', language: 'igorpro' }, { scheme: 'untitled', language: 'igorpro' }];

export const BUILTIN_URI = 'igorpro://built-in/built-in.md';
export const OPERATION_URI = 'igorpro://built-in/operation.md';
export const EXTRA_URI = 'igorpro://built-in/extra.md';
export const EXTERNAL_URI = 'igorpro://built-in/external.md';

export const AST_URI = 'igorpro://file/ast.json';
export const ACTIVE_FILE_URI = 'igorpro://file/active-document.md';

export const SCDICT_SCHEMA_URI = 'https://raw.githubusercontent.com/fujidana/vscode-igorpro/refs/heads/main/schema/ipdict.schema.json';

export function convertPosition(position: Location): vscode.Position {
    return new vscode.Position(position.line - 1, position.column - 1);
}

export function convertRange(range: LocationRange): vscode.Range {
    return new vscode.Range(convertPosition(range.start), convertPosition(range.end));
}

export interface ParserResult {
    refBook: ReferenceBook;
}

export interface FileParserResult extends ParserResult {
    includes: IncludeArgument[];
    tree?: tree.Program;
    symbols?: vscode.DocumentSymbol[];
    diagnostics?: vscode.Diagnostic[];
}

export interface DictParserResult extends ParserResult {
    identifier: string;
    scope: 'extension' | 'global' | 'workspace';
    $schema?: string;
    name?: string;
    description?: string;
}

export type IncludeArgument = {
    range: vscode.Range,
    raw: string,
    builtin: boolean,
};

export type UpdateSession<T extends ParserResult = ParserResult> = { promise: Promise<T | undefined> };
export type FileUpdateSession = { promise: Promise<FileParserResult | undefined>, tokenSource?: vscode.CancellationTokenSource | undefined, tokenSource1?: vscode.CancellationTokenSource | undefined };

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
    readonly isStatic?: boolean; // Used in entry in a procedure file, not in a dictionary.
    readonly overloads?: {
        readonly signature: string;
        readonly description?: string;
    }[];
};

export type VersionRange = {
    range: string;
    description?: string;
};

export const referenceCategoryNames = ['constant', 'variable', 'picture', 'macro', 'function', 'operation', 'keyword', 'structure', 'subtype', 'pragma', 'hook'] as const;

export type ReferenceCategory = typeof referenceCategoryNames[number];

/**
 * A dictionary that holds entries in a categorized manner.
 * The structure of this type is the same as the one validated by the JSON schema.
 * The object of this type is serialized and deserialized to and from JSON file.
 */
export type CategorizedDictionary = {
    readonly $schema?: string;
    readonly kind: 'igorpro.dictionary';
    readonly identifier: string;
    readonly scope: 'extension' | 'global' | 'workspace';
    readonly name?: string;
    readonly description?: string;
    readonly categories: {
        [K in ReferenceCategory]?: { [key: string]: Omit<ReferenceItem, 'category'> }
    };
};

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
    // undefined: {
    //     label: "unknown symbol",
    //     iconIdentifier: 'symbol-null',
    //     completionItemKind: undefined,
    //     symbolKind: vscode.SymbolKind.Null
    // },
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
 * Convert a `Map` object the extension internally uses to a plain object that can be exported after `JSON.stringify()`.
 * @param parserResult Object containing a Map object and some other properties.
 * @param categoryFilters Categories to be converted. Only listed categories will be included in the output object. If not specified, all categories will be included.
 * @param excludeStatic Exclude static symbols if true.
 * @returns Stringifiable object that has the `categories` proprty. To access an entry of the dictionary (a leaf of the object tree), do like the following: `obj.categories.function.sock_par`.
 */
export function convertToCategorizedDictionary(parserResult: DictParserResult, categoryFilters: readonly ReferenceCategory[], excludeStatic?: boolean): CategorizedDictionary {
    const categories: CategorizedDictionary['categories'] = {};
    for (const categoryName of categoryFilters) {
        categories[categoryName] = {};
    }

    for (const [identifier, entry] of parserResult.refBook.entries()) {
        if (!categoryFilters.includes(entry.category)) {
            continue;
        } else if (excludeStatic && entry.isStatic) {
            continue;
        }
        const dictionaryCategory = categories[entry.category];
        if (dictionaryCategory) {
            // Copy a new object with "category" property removed. 
            if (excludeStatic && entry.isStatic !== undefined) {
                dictionaryCategory[identifier] = (({ category, isStatic, ...rest }) => rest)(entry);
            } else {
                dictionaryCategory[identifier] = (({ category, ...rest }) => rest)(entry);
            }
        }
    }
    return {
        $schema: parserResult.$schema,
        kind: 'igorpro.dictionary',
        identifier: parserResult.identifier,
        scope: parserResult.scope,
        name: parserResult.name,
        description: parserResult.description,
        categories: categories
    } satisfies CategorizedDictionary;
}

/**
 * Convert a plain object that can be imported from file via `JSON.parse()` to a `Map` object the extension internally uses.
 * @param dictionary Object typically parsed from a JSON file, where reference items are categorized under `categories` property.
 * @param categoryFilters Categories to be converted. Only listed categories will be included in the output object. If not specified, all categories will be included.
 * @returns Object containing a Map object and some other properties.
 */
export function convertFromCategorizedDictionary(dictionary: CategorizedDictionary, categoryFilters: readonly ReferenceCategory[] = referenceCategoryNames): DictParserResult {
    const refBook: ReferenceBook = new Map();
    for (const [categoryName, entries] of Object.entries(dictionary.categories)) {
        if (categoryFilters.includes(categoryName as keyof typeof dictionary.categories)) {
            for (const [identifier, entry] of Object.entries(entries)) {
                // if (refBook.has(identifier)) {
                //     console.log(`Identifiers are duplicated!: ${identifier}`);
                // }
                const refItem: ReferenceItem = { ...entry, category: categoryName as keyof typeof dictionary.categories };
                refBook.set(identifier, refItem);
            }
        }
    }
    return {
        identifier: dictionary.identifier,
        scope: dictionary.scope,
        $schema: dictionary.$schema,
        name: dictionary.name,
        description: dictionary.description,
        refBook,
    };
}
