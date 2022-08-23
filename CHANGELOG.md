# Change Log

All notable changes to the "igor" extension will be documented in this file.

## [Unreleased]

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
    - declarations, such as `Function`, and `Macro`
    - compiler directives, such as `#prgama` and `#ifdef`
  - language configurations
    - comment toggling (line comment only (`//`). Igor Pro does not support block comments)
    - bracket definision, auto closing, Autosurrounding (`{}`, `[]`, `()`, `''`, `""`)
    - indentation rules

[Unreleased]: https://github.com/fujidana/vscode-igorpro/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/fujidana/vscode-igorpro/releases/tag/v1.0.0
