// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SystemProvider } from './systemProvider';
import { UserProvider } from './userProvider';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	new SystemProvider(context);
	new UserProvider(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
