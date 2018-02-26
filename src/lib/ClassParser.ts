import * as jscodeshift from 'jscodeshift';
import * as vscode from 'vscode';
import { stripIndent } from 'common-tags';
import { FileCache } from '../FileUtils';
import * as ast from 'egg-ast-utils';

import { ExtensionContext, workspace, Uri, WorkspaceFolder, GlobPattern } from 'vscode';
import { SnippetCompletionItem } from '../VmateSnippet';

export async function init(context: ExtensionContext) {
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

  const serviceFilesPath:GlobPattern = `**/app/service/*.js`;
  const serviceFilesCache:FileCache = new FileCache(serviceFilesPath, {
    parserFn: ast.parseClass
  });
  context.subscriptions.push(serviceFilesCache);

  const files = await serviceFilesCache.readFiles(serviceFilesPath, 'node_modules');

  const result = [];

  for (const { content, uri } of files) {
    const key = uri.toString().match(/app\/service\/(\w*)\.js/)[1];
    const items = content.children;
    result.push({ key, items });
  }

  const fileCaches = result;
  const snippets = [];
  fileCaches.map(item => {

    const key = item.key;
    const resources = item.items;
    for (const prop in resources) {
      const {value, node} = resources[prop][0];
      if (node.type === 'MethodDefinition') {
        const snippetString = [];
        if (value.async) {
          snippetString.push('async ');
        } else if (value.generator) {
          snippetString.push('yield ');
        }
        let params = [];
        if (value.params && value.params.length) {
          let ii = 2;
          params = value.params.map((param) => {
            if (param.type === 'Identifier')
              return `\${${ii}:${param.name}}`;
          })
        }
        snippetString.push(`\${1|this.service.${key},app.service.${key},service.${key},service,${key}|}.${prop}(`)
        snippetString.push(params.join(', '))
        snippetString.push(`);`)
        snippets.push({ key, prop, snippet: snippetString.join('') });
      }

    }
  });


  //register snippet
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['javascript'], {
    provideCompletionItems() {
      return snippets.map(item => new SnippetCompletionItem(`service.${item.key}.${item.prop}`, item.snippet));
    }
  }))

}


