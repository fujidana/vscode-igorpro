# Change Log

All notable changes to the `vscode-igorpro` extension will be documented in this file.

## [Unreleased]

### Added

- Primitive "Provide Diagnostics" feature. Currently only top-level elements are checked.
- "Show all Symbol Definitions Within a Document" feature.
- "Show Definitions of a Symbol" feature
- Extend IntelliSense support to symobls in workspace.
  - Currently IntelliSense does not trace `#include` statements and thus it suggests all non-static functions and constants in workspaces.
  - Local variables and waves are not yet supported.
- Improve "Show all Symbol Definitions Within a Document" feature. A menu block and a picture declaration are now marked as symbols.
  
## [1.1.0] -- 2022-09-06

### Added

- symbol navigation inside a file, including breadcrumbs. Functions, macros, structures, and constants are marked as symbols.
- support of a file drop on an editor. The file path is automatically formatted as an `#include` statement.

### Changed

- Make IntelliSence context-sensitive (refer to "IV-1 — Working with Commands / Types of Commands" in the Igor Pro Manual).
  - Hists for built-in operartions are shown only at the beginning word of the command.
  - Hints for built-in functions are not shown at the beginning word of the command.
  - Hints are disabled when a word starts with a slash, `/`. Usually it is a flag of an operation.

### Fixed

- a minor bug in syntax highlighting rules.

## [1.0.0] -- 2022-08-31 (initial release)

### Added

- following IntelliSense features for built-in symbols (functions, operations, keywords, etc.)
  - "Show Code Completion Proposals" feature
  - "Show Hovers" feature
  - "Help With Function and Method Signatures" feature
- virtual document that lists built-in symbols (call "Igor Pro: Open Reference Manual" from Command Pallete)
- syntax highlighting
- code snippets
  - flow controls such as `if` and `for`.
  - declarations such as `Function` and `Macro`
  - compiler directives such as `#prgama` and `#ifdef`
- language configurations
  - comment toggling (line comment only (`//`). Igor Pro does not support block comments)
  - bracket definision, auto closing, Autosurrounding (`{}`, `[]`, `()`, `''`, `""`)
  - indentation rules

[Unreleased]: https://github.com/fujidana/vscode-igorpro/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/fujidana/vscode-igorpro/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/fujidana/vscode-igorpro/releases/tag/v1.0.0
