# Change Log

All notable changes to the "igor" extension will be documented in this file.

## [Unreleased]

### Added

- Make IntelliSence context-sensitive (refer to "IV-1 — Working with Commands / Types of Commands" in the Igor Pro Manual)
  - Hists for built-in operartions are shown only at the beginning word of the command.
  - Hints for built-in functions are not shown at the beginning word of the command.
  - Hists are disabled when a word starts with a slash, `/`. Usually it is a flag of an operation.
- Support a file drop on an editor (automatically format as an `#include` statement).

## [1.0.0]

- Initial release. The following features are implemented:
  - following IntelliSense features for built-in symbols (functions, operations, keywords, etc.)
    - hovers
    - completion items
    - signature helps for functions
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

[Unreleased]: https://github.com/fujidana/vscode-igorpro/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/fujidana/vscode-igorpro/releases/tag/v1.0.0
