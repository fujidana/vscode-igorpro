# Change Log

All notable changes to the `vscode-igorpro` extension will be documented in this file.

## [Unreleased]

### Changed

- Raise the minimum VS Code version to 1.120.0.

### [2.2.0] -- 2026-05-12

### Added

- Restruct the code for multilingual support (i.e, internationalization) and add Japanese localization. Issue [#76](https://github.com/fujidana/vscode-igorpro/issues/76).
- Enable to store user-defined dictionaries in the _Global State_ and _Workspace State_. Issue [#78](https://github.com/fujidana/vscode-igorpro/issues/78).
  - To use a user-defined dictionary in the previous version (v2.0.0--v2.1.0), a user needed to put a JSON file in one's PC and set the path in the `vscode-igorpro.suggest.symbolFile` setting. This feature is replaced by the new feature and the setting is deprecated.
  - The following commands are added to manage user-defined dictionaries:
    - `vscode-igorpro.showDictionaryPreview`: Show the content of a user-defined dictionary in a markdown text and its preview. This command can also show the preview of built-in dictionary.
    - `vscode-igorpro.showDictionarySource`: Show the JSON-formatted user-defined dictionary in the active editor. This command can also show a template for a new dictionary based on the workspace symbols.
    - `vscode-igorpro.registerDictionary`: Register the JSON-formatted content of the active editor as a user-defined dictionary.
    - `vscode-igorpro.deleteDictionary`: Delete a user-defined dictionary.
  - Remove the following commands related to user-defined dictionaries, since the new commands cover the same features and more:
    - `vscode-igorpro.showBuiltInSymbols`
    - `vscode-igorpro.showWorkspaceSymbolsJson`

### Changed

- Raise the minimum VS Code version to 1.110.0.
- Bump `semver` dependency to 7.8.0.
- Add `vscode-igorpro.dictionaryPreview` setting and deprecate `vscode-igorpro.showSymbolsInPreview` setting. The former setting has more options to control the content of the preview.

### Fixed

- Fix a bug where information about symbol signature is not shown in completion items in some cases.

## [2.1.0] -- 2025-12-03

### Added

- Add functions and operations added in Igor Pro 10 into the extension's IntelliSense database. Issue [#72](https://github.com/fujidana/vscode-igorpro/issues/72). The default value of `vscode-igorpro.igorVersion` setting is also changed from `"9.01"` to `"10.00"`.
- Make IntelliSense features limit the scope of global symbols with reference to the `#include` chains. Previously all global symbols were simply suggested. "vscode-igorpro.suggest.scope" setting was added to control this behavior. Issue [#53](https://github.com/fujidana/vscode-igorpro/issues/53).

### Changed

- Make syntax parser and syntax highlighting rules accept line continuation (a backslash followed by a line break) in more places, for better compatiblity with Igor Pro 10 (not perfectly the same as Igor Pro 10's compiler). Issue [#74](https://github.com/fujidana/vscode-igorpro/issues/74).
- Rename "Show Workspace Symbols (JSON)" command action "Show User-defined Symbols (JSON)" and now the document exported by this action is affected by the "vscode-igorpro.suggest.scope" setting. Issue [#53](https://github.com/fujidana/vscode-igorpro/issues/53).
- Raise the minimum VS Code version to 1.102.0.

### Fixed

- Fix a bug where "Go to Definition" feature linked to static symbols in another file. Issue [#66](https://github.com/fujidana/vscode-igorpro/issues/66).

## [2.0.0] -- 2025-07-27

### Added

- Make IntelliSense features refer to the availability of symbols, based on the targeted Igor Pro version specified at "vscode-igorpro.specVersion" setting (e.g., unsupported APIs at the version are hidden in the auto-completion list). Issue [#39](https://github.com/fujidana/vscode-igorpro/issues/39).
- Enable to load an external library file by specifying the path at "vscode-igorpro.suggest.symbolFile" setting. Issue [#59](https://github.com/fujidana/vscode-igorpro/issues/59).
- Add "Show User-defined Symbols (JSON)" command action to export the symbols defined in the workspace. Issue [#59](https://github.com/fujidana/vscode-igorpro/issues/59).
- Make paths in `#include` statements clickable links. Issue [#54](https://github.com/fujidana/vscode-igorpro/issues/54).
- Use local variables in the active editor for IntelliSense features. Issue [#57](https://github.com/fujidana/vscode-igorpro/issues/57).

### Changed

- Change the internal architecture to better support asynchronous operations. This change potentially enhances the performance in some situations. Issue [#56](https://github.com/fujidana/vscode-igorpro/issues/56).
- Change the prefix of the identifiers of the settings from `igorpro` to `vscode-igorpro`. Issue [#41](https://github.com/fujidana/vscode-igorpro/issues/41).
- Raise the minimum VS Code version to 1.101.0.

### Fixed

- Fix a problem where restoration of a reference manual document is failed after VS Code is relaunched. Issue [#37](https://github.com/fujidana/vscode-igorpro/issues/37).

## [1.5.0] -- 2025-06-04

### Added

- Enable the extension to run in _VS Code for the Web_ (vscode.dev, github.dev).

### Changed

- Migrate the bundler from `webpack` to `esbuild`.

### Fixed

- Improve auto-indentation behavior when letter case of built-in keywords is mixed. issue [#32](https://github.com/fujidana/vscode-igorpro/issues/32).

## [1.4.4] -- 2025-05-21

### Added

- Add description for built-in keywords.

### Changed

- Update Node.js packages.
  - Eliminate the dependency on `ts-pegjs` and bump the version of `peggy` from 3 to 5.
- Raise the minimum VS Code version to 1.100.0.

## [1.4.3] -- 2024-09-06

### Fixed

- Support the following syntax, which the extension author had missed to implement.
  - Line continuation using a backslash. The implemented rule is mcuh more lenient than that of Igor Pro's compiler. #19

## [1.4.2] -- 2024-08-22

### Fixed

- Improve the syntax parser, including fixes of problems reported in #25, #26, and #27.
- Fix a bug that the parameters of a function are not correctly shown in code hint features such as hover and auto-completion. This bug was introduced in v1.4.0. #27

## [1.4.1] -- 2024-08-16

### Fixed

- Support the following syntaxes, which the extension author had missed to implement.
  - wave subrange without a comma, e.g., `wv[1; 3]`. #19
  - call of function defined in nested modules, e.g., `IndependentModuleA#RegularModuleA#Test()`. #20
- Fix a bug on special precedence rule of power operator, introduced in v1.4.0.

## [1.4.0] -- 2024-08-14

### Changed

- Update Node.js packages, including a vulnerable dependency.
- Raise the minimum VS Code version to 1.91.0.

### Fixed

- Support the following syntaxes, which the extension author had missed to implement.
  - _Optional Parameters_ of functions. #5
  - _Obsolete Operators_ for bit-wise operations (`%~`, `%&`, `%|`), used before Igor Pro 4. #6
  - _Multiple Return Syntax_, introduced in Igor Pro 8 and extended in Igor Pro 9. #8
  - _Range-based For-Loop_, e.g., `for (String s : tw)`, introduced in Igor Pro 9. #9
  - _Pass-By-Reference_. #12
  - special precedence rule of power operator `^` that allows `2^-2`. #17
- Fix an issue where `String` keyword was not properly tokenized and thus, not colorized.
- Fix other minor problems in syntax highlighting rules.

## [1.3.0] -- 2023-04-21

### Added

- Make "Provide Diagnostics" feature check grammar of statements inside top-level elements.

### Changed

- Update Node.js packages, including peggy (ver. 2 -> 3) and ts-pegjs (ver. 3 -> 4).
- Raise the minimum VS Code version to 1.76.0.

## [1.2.0] -- 2022-09-15

### Added

- Add primitive "Provide Diagnostics" feature. Currently only top-level elements are checked.
- Add "Show all Symbol Definitions in Folder" feature.
- Add "Show Definitions of a Symbol" feature.
- Extend IntelliSense support to symobls in workspaces.
  - Currently IntelliSense does not trace files included by `#include`; it suggests all non-static functions and constants in workspaces.
  - Local variables and waves are not yet supported.
- Improve "Show all Symbol Definitions Within a Document" feature. A menu block and a picture declaration are now marked as symbols.
  
## [1.1.0] -- 2022-09-06

### Added

- Add "Show all Symbol Definitions Within a Document" feature, including breadcrumbs. Functions, macros, structures, and constants are marked as symbols.
- Support a file drop on an editor. The file path is automatically formatted as an `#include` statement.

### Changed

- Make IntelliSence context-sensitive (refer to "IV-1 — Working with Commands / Types of Commands" in the Igor Pro Manual).
  - Hists for built-in operartions are shown only at the beginning word of the command.
  - Hints for built-in functions are not shown at the beginning word of the command.
  - Hints are disabled when a word starts with a slash, `/`. Usually it is a flag of an operation.

### Fixed

- Fix a minor bug in syntax highlighting rules.

## [1.0.0] -- 2022-08-31 (initial release)

### Added

- Add following IntelliSense features for built-in symbols (functions, operations, keywords, etc.):
  - "Show Code Completion Proposals" feature
  - "Show Hovers" feature
  - "Help With Function and Method Signatures" feature
- Add feature to list built-in symbols (call "Igor Pro: Open Reference Manual" from Command Pallete).
- Add syntax highlighting.
- Add code snippets.
  - flow controls such as `if` and `for`.
  - declarations such as `Function` and `Macro`
  - compiler directives such as `#prgama` and `#ifdef`
- Add language configurations.
  - comment toggling (line comment only (`//`). Igor Pro does not support block comments)
  - bracket definition, auto closing, Autosurrounding (`{}`, `[]`, `()`, `''`, `""`)
  - indentation rules

[Unreleased]: https://github.com/fujidana/vscode-igorpro/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/fujidana/vscode-igorpro/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/fujidana/vscode-igorpro/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.4.4...v1.5.0
[1.4.4]: https://github.com/fujidana/vscode-igorpro/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/fujidana/vscode-igorpro/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/fujidana/vscode-igorpro/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/fujidana/vscode-igorpro/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/fujidana/vscode-igorpro/releases/tag/v1.0.0
