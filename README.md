# Igor Pro Extension for Visual Studio Code

The extension helps you editing Igor procedure files (`*.ipf`).

The author of this extension is just a Igor Pro user and has no more relation with Wavemetrics, Inc., which develops Igor Pro itself.
Use [GitHub issues](https://github.com/fujidana/vscode-igorpro/issues) for bug reports and feature requests about this extension.

The textual contents of the IntelliSens code hints are cited from [the official manual](https://www.wavemetrics.com/products/igorpro/manual) (manual revision: June 24, 2022 (9.01)) and the in-app command helps (application version: 9.01 (Build 39200)).

## Features

- __Diagnostics__ - syntax check
- __basic linguistic support for editing__ - comment toggling, indentation adjustment, etc.
- __syntax highlighting__ - colorizing symbols using a grammar
- __IntelliSens__ - code completion and hinting
  - __hovers__
  - __code completion proposals__ - autocompletion that works during a user types a symbol
    - __code snippets__ - templates that make it easier to enter repeating code patterns, such as loops and conditional-statements
  - __Help with function signatures__ - help that appears during a user types an argument in a function call
- __Code navigation__
  - __Symbol navigation in workspaces__ - available via _Go to Symbol in Workspace_ (Ctrl+T)
  - __Show definitions of a symbol__ - available via _Go to Definition_ (F12) and _Peek Definition_ (Alt+F12)
  - __links__ - link to a file specified in `#include` statements.

Currently IntelliSense features support user-defined constants, structure, macros, and functions, in addition to built-in keywords, functions and operations; it does not cover local parameters (variables, strings, wave references, etc.) inside user-defined functions.

## Known Issues

See also [GitHub issues](https://github.com/fujidana/vscode-igorpro/issues).

### Code Helps not complete

Code hinting database currently lacks descriptive messages of most symbols (See Issue #1).
Contribution to the point is very welcome.

### Limitations of Syntax Highlighting

While Igor Pro allows function declarations which span several lines, this extension can not colorize them properly, owing to the limitation of the syntax highlithing grammar of VS Code.
It is recommended to declare functions in a single line.

```igorpro
// multi-line definition appeared in IgorMan.pdf, not colorized properly
Function Example2(
    Variable a, // The comma is optional
    [
        Variable b,
        double c
    ]
    )
    Print a,b,c
End

// single-line definition, colorized properly
Function Example2(Variable a, [Variable b, double c])
    Print a,b,c
End
```

### Limitations of Diagnostics

The current syntax parser is far from perfect.
If you find any problems, report it on [GitHub issues](https://github.com/fujidana/vscode-igorpro/issues).

In Igor Pro, several _Operations_ such as `FuncFit` and `MatrixOp` have a special grammar that is different from the basic syntax used for arithmetic calculation, etc.
To avoid lines of such an _Operation_ being listed in "Problems" view of VS Code, currently the parser simply skips strict syntax check when the line starts with a built-in _Operation_ name.
