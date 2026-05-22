import * as vscode from 'vscode';
import type { Location, LocationRange } from './parser';
import type * as tree from './tree';

export const SELECTOR = { language: 'igorpro' };
// export const SELECTOR = [{ scheme: 'file', language: 'igorpro' }, { scheme: 'untitled', language: 'igorpro' }];

export const AST_URI = 'igorpro://file/ast.json';
export const ACTIVE_FILE_URI = 'igorpro://file/active-document.md';

export const DICT_SCHEMA_URI = 'https://raw.githubusercontent.com/fujidana/vscode-igorpro/refs/heads/main/schema/ipdict.schema.json';

export function convertPosition(location: Location): vscode.Position {
    return new vscode.Position(location.line - 1, location.column - 1);
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

export interface IncludeArgument {
    range: vscode.Range;
    path: string;
    system: boolean;
}

export type UpdateSession<T extends ParserResult = ParserResult> = { promise: Promise<T | undefined> };
export type FileUpdateSession = { promise: Promise<FileParserResult | undefined>, tokenSource?: vscode.CancellationTokenSource | undefined };

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
    readonly range: string;
    readonly description?: string;
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

export function getVersionRangeDescription(versionRange: VersionRange, label: string) {
    let tmpStr = versionRange.range === '>=0.0.0' ? `[${label} at some time]` : `[${label}: \`${versionRange.range}\`]`;
    if (versionRange.description) {
        tmpStr += ' ' + versionRange.description;
    }
    return tmpStr;
}

export function getLabelForCategory(categoryName: ReferenceCategory): string {
    switch (categoryName) {
        case 'constant':
            return 'constant';
        case 'variable':
            return 'variable';
        case 'picture':
            return 'picture';
        case 'macro':
            return 'macro';
        case 'function':
            return 'function';
        case 'operation':
            return 'operation';
        case 'keyword':
            return 'keyword';
        case 'structure':
            return 'structure';
        case 'subtype':
            return 'subtype';
        case 'pragma':
            return 'pragma keyword';
        case 'hook':
            return 'hook function';
        // default:
    }
}

function getCompletionItemKindForCategory(categoryName: ReferenceCategory): vscode.CompletionItemKind | undefined {
    switch (categoryName) {
        case 'constant':
            return vscode.CompletionItemKind.Constant;
        case 'variable':
            return vscode.CompletionItemKind.Variable;
        case 'picture':
            return vscode.CompletionItemKind.File;
        case 'macro':
            return vscode.CompletionItemKind.Method;
        case 'function':
            return vscode.CompletionItemKind.Function;
        case 'operation':
            return vscode.CompletionItemKind.Field;
        case 'keyword':
            return vscode.CompletionItemKind.Keyword;
        case 'structure':
            return vscode.CompletionItemKind.Struct;
        case 'subtype':
            return vscode.CompletionItemKind.Interface;
        case 'pragma':
            return vscode.CompletionItemKind.Keyword; // duplicated with 'keyword'
        case 'hook':
            return undefined; // no value corresponding to this kind
        // default:
    }
}

export function getSymbolKindForCategory(categoryName: ReferenceCategory): vscode.SymbolKind {
    switch (categoryName) {
        case 'constant':
            return vscode.SymbolKind.Constant;
        case 'variable':
            return vscode.SymbolKind.Variable;
        case 'picture':
            return vscode.SymbolKind.File;
        case 'macro':
            return vscode.SymbolKind.Method;
        case 'function':
            return vscode.SymbolKind.Function;
        case 'operation':
            return vscode.SymbolKind.Field;
        case 'keyword':
            return vscode.SymbolKind.Key;
        case 'structure':
            return vscode.SymbolKind.Struct;
        case 'subtype':
            return vscode.SymbolKind.Interface;
        case 'pragma':
            return vscode.SymbolKind.Key; // duplicated with 'keyword'
        case 'hook':
            return vscode.SymbolKind.Null; // no value corresponding to this kind
        // default:
    }
}

export function getIconIdentifierForCategory(categoryName: ReferenceCategory): string {
    switch (categoryName) {
        case 'constant':
            return 'symbol-constant';
        case 'variable':
            return 'symbol-variable';
        case 'picture':
            return 'symbol-misc';
        case 'macro':
            return 'symbol-method';
        case 'function':
            return 'symbol-function';
        case 'operation':
            return 'symbol-field';
        case 'keyword':
            return 'symbol-keyword';
        case 'structure':
            return 'symbol-structure';
        case 'subtype':
            return 'symbol-interface';
        case 'pragma':
            return 'symbol-keyword'; // duplicated with 'keyword'
        case 'hook':
            return 'symbol-null'; // no value corresponding to this kind
        // default:
    }
}

export class CompletionItem extends vscode.CompletionItem {
    readonly uriString: string;
    readonly isStatic: boolean;

    constructor(label: string | vscode.CompletionItemLabel, uriString: string, categoryName: ReferenceCategory, isStatic: boolean) {
        super(label, getCompletionItemKindForCategory(categoryName));
        this.uriString = uriString;
        this.isStatic = isStatic;
    };
}

/**
 * Convert a `Map` object the extension internally uses to a plain object that can be exported after `JSON.stringify()`.
 * @param parserResult Object containing a Map object and some other properties.
 * @param categoryFilter Categories to be converted. Only listed categories will be included in the output object. If not specified, all categories will be included.
 * @param excludeStatic Exclude static symbols if true.
 * @returns Stringifiable object that has the `categories` proprty. To access an entry of the dictionary (a leaf of the object tree), do like the following: `obj.categories.function.sock_par`.
 */
export function convertToCategorizedDictionary(parserResult: DictParserResult, categoryFilter: readonly ReferenceCategory[] = referenceCategoryNames, excludeStatic?: boolean): CategorizedDictionary {
    const categories: CategorizedDictionary['categories'] = {};
    for (const categoryName of categoryFilter) {
        categories[categoryName] = {};
    }

    for (const [identifier, entry] of parserResult.refBook.entries()) {
        if (!categoryFilter.includes(entry.category)) {
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
 * @param categoryFilter Categories to be converted. Only listed categories will be included in the output object. If not specified, all categories will be included.
 * @returns Object containing a Map object and some other properties.
 */
export function convertFromCategorizedDictionary(dictionary: CategorizedDictionary, categoryFilter: readonly ReferenceCategory[] = referenceCategoryNames): DictParserResult {
    const refBook: ReferenceBook = new Map();
    for (const [categoryName, entries] of Object.entries(dictionary.categories)) {
        if (categoryFilter.includes(categoryName as keyof typeof dictionary.categories)) {
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
