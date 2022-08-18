# Igor Pro Extension for Visual Studio Code

The extension helps you editing Igor procedure files (`*.ipf`).
Igor Pro versions the extension targets are 7 and later.

Note that the extension is not the official extention for Igor Pro developed by WaveMetrics.

## Features

- basic linguistic support for editing, such as comment toggling and indentation adjustment
- code snippets
- syntax highlighting

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
