# Igor Pro Extension for Visual Studio Code

The extension helps you editing Igor procedure files (`*.ipf`).
Igor Pro versions the extension targets are 7 and later.

The developer of this extension has no relation with Wavemetrics, Inc., which develops Igor Pro.
Use [GitHub issues](https://github.com/fujidana/vscode-igorpro/issues) for bug reports and feature requests about this extension.

The textual contents of the IntelliSens code hints are cited from [the official manual](https://www.wavemetrics.com/products/igorpro/manual) (manual revision: June 24, 2022 (9.01)) and also command helps (application version: 9.01 (Build 39200)) in the in-app help browser.

## Features

- __basic linguistic support for editing__ - comment toggling, indentation adjustment, etc.
- __syntax highlighting__ - colorizing symbols using a grammer
- __IntelliSens__ - code completion and hinting
  - __hovers__
  - __code completion proposals__ - autocompletion that works during a user types a symbol
    - __code snippets__ - templates that make it easier to enter repeating code patterns, such as loops and conditional-statements
  - __Help with function signatures__ - help that appears during a user types an argument in a function call

Currently IntelliSense features only support built-in symbobls; it does not cover functions and variables in a user's procedure file.

## Known Issues

### Restricted behaviors of indentation adjustment

While Igor Pro procedure is case-insensitive, the indentation adjustment feature of VS Code works based on a case-insensitive pattern matching.
Also, it does not work perfectly on `switch` and `strswitch` flow controls.
They are due to the limitation of the indentation adjustment feature of VS Code.
See [Language Configuration Guide / Indentation Rules](https://code.visualstudio.com/api/language-extensions/language-configuration-guide#indentation-rules).

### Limitations of syntax highlighting

While Igor Pro allows function declarations which span several lines, this extension can not colorize them properly, owing to the limitation of the syntax highlithing grammer of VS Code.
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
