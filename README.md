# VS Code Extension for Igor Pro

<!-- markdownlint-disable line-length -->

The extension helps you editing Igor procedure files (`*.ipf`) on Visual Studio Code (VS Code).

This is not an official extension developed by Wavemetrics, the developer of Igor Pro software.
For bug reports and feature requests regarding this extension, please open an issue on  [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues).

The textual contents of the IntelliSense code hints are cited from [the official manual](https://www.wavemetrics.com/products/igorpro/manual) (manual revision: June 24, 2022 (9.01)) and the in-app command helps (application version: 9.01 (Build 39200)).

## Features

- __Diagnostics__ - syntax check
- __Basic linguistic support for editing__ - comment toggling, indentation adjustment, etc.
- __Syntax highlighting__ - colorizing symbols using a grammar
- __Code completion and hinting__ - also called IntelliSense
  - __Hovers__
  - __Code completion proposals__ - autocompletion that works during a user types a symbol
    - __Code snippets__ - templates that make it easier to enter repeating code patterns, such as loops and conditional-statements
  - __Help with function signatures__ - help that appears during a user types an argument in a function call
- __Code navigation__
  - __Symbol navigation in a document__ - available at _Go to Symbol in Editor_ (Ctrl+Shift+O) menubar item and the navigation bar at the top the editor pane (aka breadcrumbs)
  - __Symbol navigation in workspaces__ - available via _Go to Symbol in Workspace_ (Ctrl+T)
  - __Show definitions of a symbol__ - available via _Go to Definition_ (F12) and _Peek Definition_ (Alt+F12)
  - __Links__ - link to a file specified in `#include` statements.
- __Commands__ - Several commands are explained in the [User-Defined Dictionaries](#user-defined-dictionaries) section. Commands can be invoked from the command pallate (Ctrl+Shit+P).

The extension uses the following symbols for the IntelliSense features:

- local variables in the active editor
- global constants, structure, macros, and functions in workspaces
- built-in keywords, functions and operations
- (optional) symbols defined in user-defined dictionaries. Use the commands above to access dictionaries. See the [User-Defined Dictionaries](#user-defined-dictionaries) section.

## User-Defined Dictionaries

Users can provide user-defined dictionaries to add custom symbols for code completion and hinting.
Operations not included in the built-in database can be added here.

The extension stores dictionaries in the _Global State_ and _Workspace State_.
symbols defined in the _Global State_ dictionaries are available across all workspaces; those in the _Workspace State_ dictionaries are available only in the workspace.
Dictionaries in the _Global State_ are synchronized across PCs, via VS Code's _Settings Sync_ feature.

Use the following commands to manage user-defined dictionaries:

- "Open Dictionary Preview" (`vscode-igorpro.showDictionaryPreview`)
- "Show User-Defined Dictionary in Editor" (`vscode-igorpro.showDictionarySource`)
- "Register Editor Content as User-Defined Dictionary" (`vscode-igorpro.registerDictionary`)
- "Delete User-Defined Dictionary" (`vscode-igorpro.deleteDictionary`)
- "Reload User-Defined Dictionaries" (`vscode-igorpro.reloadDictionaries`)

"Show User-Defined Dictionary in Editor" command can also be used to create a new user-defined dictionary based on command files in the workspace.
Try this command as a starting point to create a dictionary.
After editing the content, use "Register Editor Content as User-Defined Dictionary" command to send it to the global/workspace state.

The dictionary content is expected to be a JSON object conforming to the schema the extension provides.
If you want to save a copy of the dictionary, it is strongly recommended to set a file name ending with `.ipfdict.json`, then VS Code will automatically validate it against the schema.

## Known Issues

See [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues).

The current syntax parser is far from perfect.
If you find any problems, report it on [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues).

### Code Helps not complete

Code hinting database currently lacks descriptive messages of most symbols (See Issue [#1](https://github.com/fujidana/vscode-igorpro/issues/1)).
Contribution to the point is very welcome.

### Limitations of Diagnostics

In Igor Pro, several _Operations_ such as `FuncFit` and `MatrixOp` have a special grammar that is different from the basic syntax used for arithmetic calculation, etc.
To avoid lines of such an _Operation_ being listed in "Problems" view of VS Code, currently the parser simply skips strict syntax check when the line starts with a built-in _Operation_ name.

## Acknowledgements

This extension bundles a few open-source libraries using `esbuild`, while relying on some other libraries during development.
The licenses of the bundled libraries are listed in [ThirdPartyNotices.txt](ThirdPartyNotices.txt).
The extension also uses many other open-source libraries during development.
Special thanks to the authors and maintainers of these projects!

## Contributing

The extension is open to contributions.
Open an issue on [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues) for bug reports and feature requests.
If you want to contribute code, please read [CONTRIBUTING.md](CONTRIBUTING.md).
