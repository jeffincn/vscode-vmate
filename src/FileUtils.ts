'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';

export class FileCache extends vscode.Disposable {
  private watcher: vscode.FileSystemWatcher;
  private cache: Map<vscode.Uri, string> = new Map();
  private cb: Function;
  constructor(
    readonly pattern: vscode.GlobPattern,
    readonly options?: {
      json?: boolean,
      parserFn?: (content: string, uri: vscode.Uri) => any
    }
  ) {
    super(() => {
      this.watcher.dispose();
      this.cache.clear();
    });

    // normalize parserFn
    if (!options.parserFn) {
      if (options.json) {
        options.parserFn = content => JSON.parse(content);
      }
    }

    this.watcher = vscode.workspace.createFileSystemWatcher(pattern, true);
    this.watcher.onDidDelete(async uri => {
      this.cache.delete(uri)
      await this.cb(uri);
    });
    this.watcher.onDidCreate(async uri => {
      if (this.cache.has(uri)) {
        const content = await this.loadFile(uri);
        this.cache.set(uri, content);
      }
      await this.cb(uri);
    });
    this.watcher.onDidChange(async uri => {
      if (this.cache.has(uri)) {
        const content = await this.loadFile(uri);
        this.cache.set(uri, content);
      }
      await this.cb(uri);
    });
  }

  get cacheMap() {
    return this.cache;
  }

  watching(cb) {
    this.cb = cb;
  }

  async readFile(uri: vscode.Uri, noCache?: boolean): Promise<any> {
    if (!noCache && this.cache.has(uri)) {
      return this.cache.get(uri);
    }
    const content = await this.loadFile(uri);
    if (!noCache) this.cache.set(uri, content);
    return content;
  }

  async readFiles(include: vscode.GlobPattern, exclude?: vscode.GlobPattern): Promise<any[]> {
    const files = await vscode.workspace.findFiles(include, exclude);
    const result = [];
    for (const uri of files) {
      try {
        const content = await this.readFile(uri, true);
        result.push({ uri, content });
      } catch (e) {
        console.error(e);
      }
    }
    return result;
  }

  async loadFile(uri: vscode.Uri) {
    const content = await fs.readFile(uri.fsPath, 'utf-8');
    try {
      return this.options.parserFn ? this.options.parserFn(content, uri) : content;
    } catch (e) {
      console.error(e);
      return {}
    }
  }
}