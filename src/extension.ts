'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as VmateSnippet from './VmateSnippet';
import * as ClassSnippet from './lib/ClassParser';
import { ExtensionContext, commands, workspace, window, Uri } from 'vscode';
import * as globby from 'globby';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    console.log('vscode-vmate is activate!');

    const cwd = workspace.rootPath;
    const config = workspace.getConfiguration('vmate');

    if (!cwd) return;


    await VmateSnippet.init(context);
    await ClassSnippet.init(context);
    // EggTest.init(context);

    commands.registerCommand('extension.openFile', async filePath => {
        const doc = await workspace.openTextDocument(Uri.file(filePath));
        await window.showTextDocument(doc);
        if (window.activeTextEditor) {
            await commands.executeCommand('workbench.files.action.collapseExplorerFolders');
            await commands.executeCommand('workbench.files.action.showActiveFileInExplorer')
            await commands.executeCommand('workbench.action.focusActiveEditorGroup');
        }
    });

}

// this method is called when your extension is deactivated
export function deactivate() {
}