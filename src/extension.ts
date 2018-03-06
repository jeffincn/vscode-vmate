'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as VmateSnippet from './VmateSnippet';
import * as ClassSnippet from './lib/ClassParser';
import { ExtensionContext, commands, workspace, window, Uri , languages, DocumentSelector} from 'vscode';
import * as globby from 'globby';
import { StatusBarView } from './views/view';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    const statusBarView: StatusBarView = StatusBarView.getInstance();
    statusBarView.startProgress();
    statusBarView.setRunning('Vmate Extensiton Initialing ...');
    const cwd = workspace.rootPath;
    const config = workspace.getConfiguration('vmate');

    if (!cwd) return;
    await VmateSnippet.init(context);
    statusBarView.setRunning('Seeking: Service');
    await ClassSnippet.init(context, `**/app/service/**`, 'service');
    statusBarView.setRunning('Seeking: Controller');
    await ClassSnippet.init(context, `**/app/controller/**`, 'controller');
    await ClassSnippet.init(context, `**/app/lib/**`, 'lib')
    statusBarView.setCompleted('Initial Completed');
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