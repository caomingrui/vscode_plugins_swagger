import type { DeletionLabelsType } from "./index";
import * as vscode from 'vscode';

declare namespace UtilsType {
    type ApiInputType = {
        operationType: 'replace' | '替换' | 'transform' | '转换';
        apiUrl: string;
        method: string;
    }

    /**通用的操作数据 */
    type InitOperationData = {
        deletionLabels: DeletionLabelsType;
        selection: vscode.Selection;
      };
    type GenerateOperationType = 'replace' | 'transform';
    /**对应转化类型 */
    type GenerateTransform<R> = {
        transformData: Record<string, any>;
    } & R;
    type GenerateType<T extends GenerateOperationType, R> = 
    T extends 'replace'
    ? { type: T } & R
    : T extends 'transform'
    ? { type: T } & GenerateTransform<R>
    : never;
    // 不同操作
    type GenerateOperationRecords<R extends InitOperationData = any, T extends GenerateOperationType = GenerateOperationType> = {
        [k in T]: GenerateType<k, R>
    }[T];
}

export = UtilsType;