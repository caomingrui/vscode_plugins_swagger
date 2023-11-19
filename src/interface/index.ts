import * as vscode from 'vscode';
import * as t from '@babel/types';

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

/**
 * 替换目标label value
 */
export type ReplaceTargetValueProps = {
    // dto 匹配值
    elemDtoHashValue: string;
    // 当前处理label JSX元素
    targetElement: t.JSXAttribute,
    // 元素label 名称
    elemLabelName: string;
    // 元素当前行列信息
    loc: t.SourceLocation
}