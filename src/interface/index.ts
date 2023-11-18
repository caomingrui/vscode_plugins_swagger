import * as vscode from 'vscode';

export type LocType =  {
    start: {line: number, column: number}, 
    end: {line: number, column: number}
}

export type CustomDocumentsType = {
    metadata: string,
    // 更改样式
    dispatchTextDecorations: (...args: any[]) => vscode.TextEditorDecorationType,
    // 样式
    decorationTypes: vscode.TextEditorDecorationType[],
    // 缺失字段
    deletionLabels: DeletionLabelsType
  }

export type DeletionLabelsType = {
    name: string,
    loc: LocType
  }[]