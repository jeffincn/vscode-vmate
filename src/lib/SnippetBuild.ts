import * as vscode from 'vscode';
import { SnippetCompletionItem, SnippetString } from '../VmateSnippet';
import { ExtensionContext, workspace, Uri, WorkspaceFolder, GlobPattern, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

export function build(item: {key:String,items:Object}, domain:String, context:ExtensionContext): Array<vscode.Disposable> {
  const key = item.key;
  const resources = item.items;
  const snippets = [];
  const disposableList = [];
  for (const prop in resources) {
    const {value, node} = resources[prop][0];
    if (node.type === 'MethodDefinition') {
      const snippetString = [];
      let plainPrefixMethod = ' ';
      if (value.async) {
        snippetString.push('async ');
        plainPrefixMethod = '`async` ';
      } else if (value.generator) {
        snippetString.push('yield ');
        plainPrefixMethod = '`yield` ';
      } else if (isPromiseReturn(value.body)) {
        snippetString.push('yield ');
        plainPrefixMethod = '`yield` ';
      }
      let params = [];
      let plainParams = [];
      let ii = 2;
      snippetString.push(`\${1|this.${domain}.${key}.${prop},app.${domain}.${key}.${prop},ctx.${domain}.${key}.${prop},${domain}.${key}.${prop},${key}.${prop},${domain}.${prop},${prop}|}(`)
      const propParams = [];
      const plainPropParams =[];
      if (value.params && value.params.length) {
        value.params.map((param) => {
          ii++;
          if (param.type === 'Identifier') {
            params.push(`\${${ii}:${param.name}}`);
            plainParams.push(`${param.name}`);
          } else if (param.type === 'ObjectPattern') {
            propParams.push('{ ');
            plainPropParams.push('{ ');
            const { properties } = param;
            const objectParams = [];
            const plainObjectParams = [];
            properties.map(prop => {
              ii++;
              const { key } = prop;
              objectParams.push(`\${${ii}:${key.name}}`)
              plainObjectParams.push(`${key.name}`)
            })
            propParams.push(objectParams.join(', '));
            plainPropParams.push(plainObjectParams.join(', '));
            propParams.push(' }');
            plainPropParams.push(' }');
            params.push(propParams.join(''));
            plainParams.push(plainPropParams.join(''));
          } else if (param.type === 'AssignmentPattern') {
            if (param.left && param.left.type === 'Identifier') {
              params.push(`\${${ii}:${param.left.name}}`);
              plainParams.push(`${param.left.name}?`);
            }
         }
          return param;
        })
        snippetString.push(params.join(', '))

      }

      snippetString.push(`)\${${++ii}}`)

      const commentBlocks = node.comments || [];

      let comments = [];
      if (commentBlocks.length) {
        comments = commentBlocks.map(comment => comment.value.replace(/\*/g, ""))
      }
      console.info(`Found: ${domain}.${key}.${prop}`);
      console.info()
      disposableList.push(vscode.languages.registerCompletionItemProvider(
        'javascript',
        {
          provideCompletionItems() {
              return [new SnippetCompletionItem(`${domain}.${key}.${prop}`, snippetString.join(''))];
          },
          resolveCompletionItem() {
            return new ResolveCompletionItem(`${domain}.${key}.${prop}`, snippetString.join(''), `${plainPrefixMethod}${prop}( ${plainParams.join(', ')} )`, comments.join("\n"), )
          },
        },
        '.')
      );
    }
  }
  return disposableList;
}

export function  isPromiseReturn (methodBody) {
  const { body } = methodBody;
  if (body.length > 0) {
    const returnStatements = body.filter(node => {
      return (node.type === 'ReturnStatement')
    })
    for (const i in returnStatements) {
      const nodeStatement = returnStatements[i];
      const { argument } = nodeStatement;
      if (argument && argument.callee && argument.callee.type === 'Identifier' && argument.callee.name === 'Promise') {
        return true;
      }
    }
  }
  return false;
}

export class ResolveCompletionItem extends CompletionItem {
  constructor(label: string, snippet:string,  method: string, detail: string, locals?: object) {
    super(label, CompletionItemKind.Snippet);
    const markdownString = new MarkdownString(`${detail}\n\n **${method}**\n\n`);
    this.documentation = markdownString;
    this.insertText = new SnippetString(snippet, locals)
  }
}