type ApiInputType = {
    operationType: 'replace' | '替换' | 'transform' | '转换';
    apiUrl: string;
    method: string;
}

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