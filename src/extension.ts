// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BuiltInController } from './builtInController';
import { FileController } from './fileController';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// For case-insensitive match, the following settings are defined here
	// using regular expression literals, instead of string literals in
	// a JSON file (`language-configuration.json`).
	const configuration: vscode.LanguageConfiguration = {
		indentationRules: {
			increaseIndentPattern: /^\s*(?:threadsafe\s+)?(?:(?:static|override)\s+)?(?:if|else(?:if)?|do|for|switch|strswitch|try|catch|macro|menu|function|submenu|structure|Proc|Picture|Window)\b/i,
			decreaseIndentPattern: /^\s*(?:else(?:if)?|while|catch|end(?:if|for|switch|structure|try|macro)?)\b/i,
		}
	};

	context.subscriptions.push(
		vscode.languages.setLanguageConfiguration('igorpro', configuration)
	);

	const builtInController = new BuiltInController(context);
	new FileController(context, builtInController.externalOperationIdentifiers);
}

// This method is called when your extension is deactivated
export function deactivate() { }
