'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as VmateSnippet from './VmateSnippet';
import * as ClassSnippet from './lib/ClassParser';
import { ExtensionContext, commands, workspace, window, Uri , languages, DocumentSelector, WorkspaceFolder} from 'vscode';
import * as globby from 'globby';
import { StatusBarView } from './views/view';
import * as ast from 'egg-ast-utils';
import * as path from 'path';
import { fs } from 'mz';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    /**
     * 处理当文件保存时的逻辑；
     */
    workspace.onDidSaveTextDocument( async function (textDocument: vscode.TextDocument) {
        if (textDocument.languageId !== 'javascript') {
            return;
        }
        // textDocument.uri;
        // const documentPath: string = path.dirname(textDocument.uri.path);
        // const routerFile = path.join(documentPath, '/../', 'router.js');

        // const routerContent:String = await fs.readFile(routerFile, 'utf-8');
        // console.log(routerContent);
        // const routerAST = ast.parseRouter(routerContent);
        // const content:String = await fs.readFile(textDocument.uri.fsPath, 'utf-8');
        // const contentAST = ast.parseClass(content);
        // console.log(workspace.workspaceFolders);
        // console.log(textDocument.fileName);
        // console.log(contentAST);
    }, this);

    let serverRoot:Uri = workspace.getConfiguration('vmate').get('serverRoot')
    if (!serverRoot) {
        const folders = workspace.workspaceFolders;
        folders.filter((f: WorkspaceFolder) => {
            if (f.name === 'backend') {
                serverRoot = f.uri;
            }
        })
    }
    const routerFile = path.join(serverRoot.path, 'app', 'router.js');
    const routerContent:String = await fs.readFile(routerFile, 'utf-8');
    // console.log(routerContent);
    // const routerAST = ast.parseRouter(routerContent)

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

    // await ClassSnippet.init(context, `**/app/lib/**`, 'lib')
    statusBarView.setCompleted('Initial Completed');
    // EggTest.init(context);
    vscode.window.showInformationMessage('All services are seeked.');

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