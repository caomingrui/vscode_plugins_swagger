import type { GenerateOperationRecords, ApiInputType, InitOperationData } from "../interface/utils";

/**
 * 转化输入内容
 * @param {string} apiInputUrl - 输入内容
 * @return {object}
 */
export const getApiInputRecords = (apiInputUrl: string): ApiInputType => {
    const apiInputArr = apiInputUrl.split(':');
    const apiInputObj = {
        operationType: apiInputArr[0] as ApiInputType['operationType'],
        apiUrl: apiInputArr[1],
        method: apiInputArr[2]
    }
    return apiInputObj
}

/**
 * 根据不同type 生成不同操作
 * @param operationType 
 * @param initOperationRecords 
 * @returns 
 */
export function generateOperationRecords<T extends InitOperationData>(
    operationType: ApiInputType['operationType'],
    initOperationRecords?: T,
): GenerateOperationRecords<T> {
    let operationRecords: GenerateOperationRecords = initOperationRecords;
    switch(operationType) {
        case 'replace':
        case '替换':
            operationRecords = {
                type: 'replace',
            }
          break;
        case 'transform':
        case '转换':
            operationRecords = {
                type: 'transform',
                // 转化后存储对象
                transformData: {},
            }
          break;
    }
    return {
        ...operationRecords,
        ...initOperationRecords,
    };
}
