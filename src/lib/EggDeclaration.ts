import * as vscode from 'vscode';
import { Hover, HoverProvider, MarkdownString, TextDocument, Position, CancellationToken, WorkspaceConfiguration } from 'vscode';
import { isPositionInString, byteOffsetAt, nodeKeywords } from "./utils";

export interface EggDefinitionInformation {
	file: string;
	line: number;
	column: number;
	doc: string;
	declarationlines: string[];
	name: string;
	toolUsed: string;
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, goConfig: vscode.WorkspaceConfiguration, includeDocs: boolean, token: vscode.CancellationToken): Promise<EggDefinitionInformation> {
  let wordRange = document.getWordRangeAtPosition(position);
	let lineText = document.lineAt(position.line).text;
	let word = wordRange ? document.getText(wordRange) : '';
	if (!wordRange || lineText.startsWith('//') || isPositionInString(document, position) || word.match(/^\d+.?\d+$/) || nodeKeywords.indexOf(word) > 0) {
		return Promise.resolve(null);
  }
  let offset = byteOffsetAt(document, position);

  return definitionLocation_parser(document, position, offset, includeDocs, token);
}

function definitionLocation_parser(document: vscode.TextDocument, position: vscode.Position, offset: number, includeDocs: boolean, token: vscode.CancellationToken): Promise<EggDefinitionInformation> {
  return new Promise<EggDefinitionInformation>((resolve, reject) => {

  });

}