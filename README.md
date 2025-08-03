# Igor Pro Extension for Visual Studio Code

The extension helps you editing Igor procedure files (`*.ipf`).

The author of this extension is just a Igor Pro user and has no more relation with Wavemetrics, Inc., which develops Igor Pro itself.
Use [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues) for bug reports and feature requests about this extension.

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
- __Commands__ - the following commands can be invoked from the command pallate (Ctrl+Shit+P):
  - "Show Built-in Symbols"
  - "Show User-defined Symbols (JSON)": exported file can be used for importing the symbols in another workspace, with "vscode-igorpro.suggest.symbolFile" setting.

The extension uses the following symbols for the IntelliSSense features:

- local variables in the active editor
- global constants, structure, macros, and functions in workspaces
- built-in keywords, functions and operations
- (optional) symbols defined in a file whose path is specified in "vscode-igorpro.suggest.symbolFile" setting.
See issue [#59](https://github.com/fujidana/vscode-igorpro/issues/59).

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

## Contributing

The extension is open to contributions. Create an issue in [GitHub Issues](https://github.com/fujidana/vscode-igorpro/issues) for a bug report or a feature request. If you want to contribute code, please read [CONTRIBUTING.md](CONTRIBUTING.md).
