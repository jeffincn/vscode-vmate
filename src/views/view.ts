import {
  StatusBarItem,
  StatusBarAlignment,
  window } from 'vscode';



export class StatusBarView {
  private static instance: StatusBarView;
  private statusBarItem: StatusBarItem;
  private progressInterval: NodeJS.Timer;
  private spinnerActive: boolean = false;
  private prefix: string = '$(watch)';

  private constructor() {
      this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
  }

  static getInstance(): StatusBarView {
      if (!this.instance) {
          this.instance = new StatusBarView();
      }

      return this.instance;
  }

  setText(text: string, prefix: string = '$(watch)', hasCommand: boolean = true): void {
      this.statusBarItem.text = text ? `${prefix} ${text}` : prefix;
      this.statusBarItem.tooltip = hasCommand ? 'vscode-vmate' : 'No info ';
      this.statusBarItem.command = hasCommand ? '' : '';
      this.statusBarItem.show();
  }

  setRunning(text: string) {
    this.setText(text);
  }

  setCompleted(text: string) {
    this.setText(text, '$(check)');
  }

  clear(): void {
      this.stopProgress();
      this.setText('');
  }

  update(info:string): void {
      this.stopProgress();

      if (info) {
          this.setText(info);
      }
      else {
          this.clear();
      }
  }

  stopProgress(): void {
      clearInterval(this.progressInterval);
      this.spinnerActive = false;
  }

  startProgress(): void {
      if (this.spinnerActive) {
          return;
      }
      this.stopProgress();
      this.spinnerActive = true;
  }

  private setSpinner(): void {
      this.setText(`done`);;
  }

  dispose(): void {
      this.stopProgress();
      this.statusBarItem.dispose();
  }
}
