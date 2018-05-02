import * as vscode from 'vscode';
import { stripIndent } from 'common-tags';
import { FileCache } from '../FileUtils';
import * as ast from 'egg-ast-utils';
import { StatusBarView } from '../views/view';

import { ExtensionContext, workspace, Uri, WorkspaceFolder, GlobPattern } from 'vscode';
import { ProvideCompletionItem } from '../VmateSnippet';
import { build } from "./SnippetBuild";

export async function init(context: ExtensionContext, pattern:GlobPattern, domain:String) {
    const statusBarView: StatusBarView = StatusBarView.getInstance();
  const completionItemList:Map<string, Array<vscode.Disposable>>= new Map();
  let serverRoot:Uri = workspace.getConfiguration('vmate').get('serverRoot')
  if (!serverRoot) {
    const folders = workspace.workspaceFolders;
    folders.filter((f: WorkspaceFolder) => {
      if (f.name === 'backend') {
        serverRoot = f.uri;
      }
    })
  };

  if (!serverRoot) return;
  console.time("Class Service Loader");
  const serviceFilesPath:GlobPattern = pattern;
  const serviceFilesCache:FileCache = new FileCache(serviceFilesPath, {
    parserFn: ast.parseClass
  });
  const fileCache = serviceFilesCache;
  serviceFilesCache.watching(
    async function (uri) {
      statusBarView.setRunning(`Updating ${domain} file changed...` )
      const matcher = uri.toString().match(regex);
      if (matcher.length) {
        let key = matcher[2]
        if (key.indexOf('/')>-1) {
          key = key.replace('/', '.');
        }
        const disaposeList:Array<vscode.Disposable> = completionItemList.get(key);
        if (disaposeList) {
          disaposeList.forEach(value => value.dispose());
        }
        const content = await fileCache.readFile(uri, true);
        if (content) {
          const items = content.children;
          completionItemList.set(key, build({ key, items }, domain, context));
        }
        statusBarView.setCompleted(`Re-Indexed ${domain}/${key} info` )
        vscode.window.showInformationMessage(`${domain}/${key} is updated`);
      }
    }
  );


  context.subscriptions.push(serviceFilesCache);

  const files = await serviceFilesCache.readFiles(serviceFilesPath, '**/node_modules/**');

  const result = [];

  const regex = new RegExp(`(app\/${domain}\/)(.*)\.js`);
  for (const { content, uri } of files) {
    const matcher = uri.toString().match(regex);
    if (matcher && matcher.length && content ) {
      let key = matcher[2]
      if (key.indexOf('/')>-1) {
        key = key.replace('/', '.');
      }
      const items = content.children;
      result.push({ key, items });
    }
  }
  result.map(item => {
    const { key } = item;
    const completionItem = build(item, domain, context);
    completionItemList.set(key, completionItem );
  });

  console.timeEnd("Class Service Loader");

//   //register snippet
//   context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['javascript'], {
//     provideCompletionItems() {
//       return snippets.map(item => new SnippetCompletionItem(`${domain}.${item.key}.${item.prop}`, item.snippet));
//     }
//   }))

}


