'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import { stripIndent } from 'common-tags';
import { getFrameworkOrEggPath } from 'egg-utils';
import { CompletionItem, CompletionItemKind, ExtensionContext, workspace, Uri } from 'vscode';
import { FileCache } from './FileUtils';
import * as moment from 'moment';

export async function init(context: ExtensionContext) {
  const cwd = vscode.workspace.rootPath;
  const date = moment().format('YYYY-MM-DD');
  const fileCache = new FileCache('**/assets/templates/*.tmpl', {});
  context.subscriptions.push(fileCache);

  // get config
  let config = workspace.getConfiguration('vmate.snippet');
  workspace.onDidChangeConfiguration(() => {
    config = workspace.getConfiguration('vmate.snippet');
  });

  // get framework name

  const author = context.workspaceState.get('vmate.author', 'guo jianfeng');

  const authoremail = context.workspaceState.get('vmate.authoremail', 'gjf89268@alibaba-inc.com');

  // preset of snippets
  const snippets = {
    controller: await fileCache.readFile(Uri.file(path.join(__dirname, '../../assets/templates/vmate.eggcontroller.tmpl'))),
    service: await fileCache.readFile(Uri.file(path.join(__dirname, '../../assets/templates/vmate.eggservice.tmpl'))),
    entity: await fileCache.readFile(Uri.file(path.join(__dirname, '../../assets/templates/vmate.entity.tmpl')))
  }

  const shortSnippets = {
    query: `app.mysql.query`,
    update: `app.mysql.update`,
    del: `app.mysql.del`,
    delete: `app.mysql.delete`,
    select: `app.mysql.select`,
    create: `app.mysql.create`,
    insert: `app.mysql.insert`
  }

  // register snippet
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider([ 'javascript' ], {
    provideCompletionItems() {
      return Object.keys(snippets).map(key => new SnippetCompletionItem(`vmate ${key}`, stripIndent`${snippets[key]}` + '\n'));
    },
    resolveCompletionItem(item: CompletionItem, token: vscode.CancellationToken): vscode.CompletionItem {
      //FIXME: hacky, replace fn style
      const snippet = item.insertText as SnippetString;
      snippet.value = snippet.value.replace(/\$\{TM_STYLE_FN}/g, config.fnStyle || '${1|*,async|}');
      snippet.value = snippet.value.replace(/\$\{TM_DATE}/g, date);
      snippet.value = snippet.value.replace(/\$\{TM_AUTHOR}/g, author);
      snippet.value = snippet.value.replace(/\$\{TM_AUTHOR_EMAIL}/g, authoremail);
      return item;
    }
  }));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['javascript'], {
    provideCompletionItems() {
      return Object.keys(shortSnippets).map(key => new SnippetCompletionItem(`app.${key}`, stripIndent`${shortSnippets[key]};`));
    }
  }))
}

export class SnippetCompletionItem extends CompletionItem {
  constructor(label: string, snippet: string, locals?: object) {
    super(label, CompletionItemKind.Snippet);
    this.insertText = new SnippetString(snippet, locals);
  }
}
export class SnippetString extends vscode.SnippetString {
  public value;
  constructor(value: string, locals: object = {}) {
    // preset variable
    locals = Object.assign({}, {
      TM_FILE_CLASS: 'TM_FILENAME_BASE/(.*)/${1:/capitalize}/',
      TM_ENTITY: 'TM_FILENAME_BASE/(.*)/${1:/downcase}/'
    }, locals);

    // replace
    let snippet = value;
    for (const key of Object.keys(locals)) {
      snippet = snippet.replace(new RegExp(key, 'g'), locals[key]);
    }
    super(snippet);
  }
}