# Igor Pro Extension for Visual Studio Code

The extension helps you editing Igor procedure files (`*.ipf`).
Igor Pro versions the extension targets are 7 and later.

Note that the extension is not the official extention for Igor Pro developed by WaveMetrics.

## Features

- basic linguistic support for editing, such as comment toggling and indentation adjustment
- code snippets

## Known Issues

### Restricted behaviors of indentation adjustment

While Igor Pro procedure is case-insensitive, indentation adjustment works based on a case-insensitive pattern matching.
Also, it does not work perfectly on `switch` and `strswitch` flow controls.
They are due to the limitation of the indentation adjustment feature of VS Code. See [Language Configuration Guide / Indentation Rules](https://code.visualstudio.com/api/language-extensions/language-configuration-guide#indentation-rules).
