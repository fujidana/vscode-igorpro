# Change Log

All notable changes to the `vscode-igorpro` extension will be documented in this file.

## [Unreleased]

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

- a minor bug in syntax highlighting rules.

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
  - bracket definision, auto closing, Autosurrounding (`{}`, `[]`, `()`, `''`, `""`)
  - indentation rules

[Unreleased]: https://github.com/fujidana/vscode-igorpro/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/fujidana/vscode-igorpro/releases/tag/v1.0.0
