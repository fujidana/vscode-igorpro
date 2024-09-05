Contributing
====

The extention author welcomes bug reports and pull requests.

Setup for extension authoring
----

One can set up the extension authoring environtment by the follwing proceduere.

**Note**: Keyboard shotcuts in this section are for macOS.

1. Install the tools commonly required for VS Code extension authoring: VS Code, Git, and Node.js.
2. Install additional tools the extension relies on: `npm install --global pnpm @vscode/vsce` . The extension uses `pnpm` instead of `npm` as the package manager. `@vscode/vsce` is optional; it is required when you want to build a extension as a VSIX file.
3. Fetch the repository of the extension source code: `git clone https://your_username@github.com/fujidana/vscode-igorpro.git` (`your_username@` may be unnecessary).
4. Open the cloned folder with VS Code: `cd vscode-igorpro; code .` (or via GUI).
5. Install Node.js packages the extension depends on: `pnpm install`

Then the installation is completed but there are a few more things to do.
TypeScript files (.ts) are automatically compiled before running the exetension but YAML files (.yaml) or a Peggy file (.pegjs) are not.
Execute `pnpm run js-yaml` and `pnpm run peggy` to convert them manually.
A play button at the right side of "peggy" and "js-yaml" in "NPM SCRIPTS" panel in the "Explorer" viewlet (Cmd+Shit+E) calls the same commands.
Remember to do the same thing after you modify these files.

Once YAML files and a Peggy file are converted, then the extension is really ready to run.
Push a play button in "Run" View (Cmd+Shift+D) or select the menu bar item "Run / Start Debugging" (F5).

To create a `.vsix` file for local distribution, run the following: `vsce package --no-dependencies` .
