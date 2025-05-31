Contributing
====

**Note**: Keyboard shotcuts in this section are for macOS.

The first step to contribute is to open an issue in the repository. The author will discuss with you about the issue and then you can start coding.

To send a pull request, follow these steps:

1. Fork the repository. Click the "Fork" button on the top right of the repository page on GitHub.
2. Create a new branch.
3. Edit code.
4. Commit the changes and then push the branch to your forked repository.
5. Create a pull request to merge into main branch of `fujidana/vscode-igorpro`.

Setup for extension authoring
----

1. Install VS Code (`code`), Git (`git`), and Node.js (`node`, `npm`).
2. Install `pnpm` and `vsce` by the following command (`vsce` is optional): `npm install --global pnpm @vscode/vsce`.
3. Clone the original or forked repository: `git clone https://github.com/your_username/vscode-igorpro.git`. Replace `your_username` with `fujidana` if you want to clone the original repository.
4. Open the cloned folder with VS Code: `cd vscode-igorpro; code .` (or via GUI). In the following, we assume you are in the `vscode-igorpro` folder. The easiest way to do so is to use the terminal in VS Code (Ctrl+Shift+`).
5. Install Node.js packages the extension depends on: `pnpm install`
6. Execute the following command `pnpm run js-yaml` to convert YAML files (.yaml) manually.
A play button at the right side of "js-yaml" in "NPM SCRIPTS" panel in the "Explorer" viewlet (Cmd+Shift+E) calls the same command. Remember to do the same thing after you modify these files.

Then the setup is complete.
Push a play button in "Run" View (Cmd+Shift+D) or select the menu bar item "Run / Start Debugging" (F5). Then another instance of VS Code will be launched after compilation of source code. The extension running in this VS Code is what you have in your machine and not the one from the marketplace. You can edit code and then check the behavior.

(Note@2025-05-29: Now a peggy file is compiled during this process and thus, a user does not have to compile it manually.)

To create a `.vsix` file for local distribution, first install `vsce` by the following: `npm install --global @vscode/vsce`, and then run the following: `vsce package --no-dependencies`.

Update for extension authoring
----

One can pull the latest changes from the remote repository by the following procedure:

1. Open the cloned `vscode-igorpro` folder with VS Code.
2. To pull the latest changes in the remote repository, run `git pull` in the terminal or select "Git: Pull" in the Command Palette (Cmd+Shift+P).
3. Resolve conflicts if any.
4. Install any new dependencies or updates by running `pnpm install` in the terminal.
