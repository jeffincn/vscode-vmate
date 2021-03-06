import * as vscode from 'vscode';
import { ProvideCompletionItem, SnippetString } from '../VmateSnippet';
import { ExtensionContext, workspace, Uri, WorkspaceFolder, GlobPattern, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString, TextDocument, Position, CancellationToken, CompletionContext } from 'vscode';

export function build(item: {key:String,items:Object}, domain:String, context:ExtensionContext): Array<vscode.Disposable> {
  const key = item.key;
  const resources = item.items;
  const snippets = [];
  const disposableList = [];
  for (const prop in resources) {
    const {value, node} = resources[prop][0];
    if (node.type === 'MethodDefinition' ) {
      const snippetString = [];
      let plainPrefixMethod = ' ';
      if (isAsyncReturn(node, domain)) {
        snippetString.push('await ');
        plainPrefixMethod = '`await` ';
      } else if (isPromiseReturn(node, domain)) {
        snippetString.push('yield ');
        plainPrefixMethod = '`yield` ';
      }
      let params = [];
      let plainParams = [];
      let ii = 2;

      if (domain === 'controller') {
        snippetString.push(`\${1|app.${domain}.${key}.${prop},${domain}.${key}.${prop},${key}.${prop}|}`)
      } else {
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
      }


      const commentBlocks = node.comments || [];

      let comments = [];
      if (commentBlocks.length) {
        comments = commentBlocks.map(comment => comment.value.replace(/\*/g, ""))
      }
      if (!(/\@(private)/ig).test(comments.join(''))) {
        console.info(`Found: ${domain}.${key}.${prop}`);
        console.info()
        disposableList.push(vscode.languages.registerCompletionItemProvider(
          'javascript',
          {
            provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
                return [new ProvideCompletionItem(`${domain}.${key}.${prop}`, snippetString.join(''), `${plainPrefixMethod}${prop}( ${plainParams.join(', ')} )`, comments.join("\n"), document, position, token, context)];
            },
            resolveCompletionItem(item: CompletionItem, token: CancellationToken) {
              return item;
            },
          },
          '.')
        );

      }
    }
  }
  return disposableList;
}

export function isAsyncReturn(node, domain) {
  const { comments, value } = node;
  const { body } = value.body;

  if (domain === 'controller') {
    return false;
  }
  if (value.async) return true;
  if (comments) {
     const commentInfo= comments.map(comment => comment.value.replace(/\*/g, ""))
    if ((/\@(async)/ig).test(commentInfo.join(''))) {
      return true;
     }
  }
  return false;
}

export function  isPromiseReturn (node, domain) {
  const { comments, value } = node;
  const { body } = value.body;

  if (domain === 'controller') {
    return false;
  }

  if (value.generator) return true;
  if (comments) {
     const commentInfo= comments.map(comment => comment.value.replace(/\*/g, ""))
    if ((/\@(yield)/ig).test(commentInfo.join(''))) {
      return true;
     }
  }
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
    super(label, CompletionItemKind.Method);
    const markdownString = new MarkdownString(`${detail}\n\n **${method}**\n\n`);
    this.documentation = markdownString;
    this.detail = '详细接口说明';
    this.insertText = new SnippetString(snippet, locals);
  }
}