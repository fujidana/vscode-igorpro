import * as vscode from 'vscode';
import { DictionaryController } from './dictionaryController';
import { FileController } from './fileController';

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

	const dictionaryController = new DictionaryController(context);
	new FileController(context, dictionaryController.externalOperationIdentifiers);
}

export function deactivate() { }
