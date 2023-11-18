import { Method } from "axios";
import type { 
    ApiFileJsonConstructor,
    ApiFileJsonInstance,
    ApiFileJsonProps,
    PathsType,
    DefinitionsType,
} from "../interface/apiFileJson";
const fs = require('fs');
let defaultFilePath = 'C:\\Users\\mingrui\\Desktop\\note\\api\\test.json'

export const ApiFileJson: ApiFileJsonConstructor = function (this: ApiFileJsonInstance, props: ApiFileJsonProps = {}) {
    const { filePath } = props;
    this.apiHashMap = new Map();
    this.apiDtoModuleHashMap = new Map();
    this.filePath = filePath || defaultFilePath;

    const init = () => 
        new Promise(async(resolve, reject) => {
            try {
                const data = await this.readFile(this.filePath);
                const { paths, definitions } = JSON.parse(data);
                this.eachRenderDto(definitions);
                this.eachApiPaths(paths);
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });

    this.initStatus = init();
} as any;

/**
 * 读取文件
 */
ApiFileJson.prototype.readFile = function (filePath?: string) {
    filePath = filePath || this.filePath;
    let resolve: (data: unknown) => void , reject: (data: unknown) => void;
    const promise = new Promise((x, y) => { resolve = x; reject = y; });
    fs.readFile(filePath, 'utf8', (err: unknown, data: string) => {
        if (err) {
            reject(err);
        }
        resolve(data);
    })
    return promise;
}

/**
 * 解析swagger下paths对象
 */
ApiFileJson.prototype.eachApiPaths = function (paths?: Record<string, PathsType>) {
    if (!paths) return;
    for (let apiUrl in paths) {
        let methods = Object.keys(paths[apiUrl]) as Method[];
        for (let apiMethod of methods) {
            const apiModule = paths[apiUrl][apiMethod];
            const { parameters, responses } = apiModule;
            if (!parameters) continue;
            const params = parameters[0];
            if (!params.schema) continue;
            const paramsOriginalRef = params.schema.originalRef;
            let originalDto = this.apiDtoModuleHashMap.get(paramsOriginalRef);
            
            if (originalDto) {
                this.apiHashMap.set(`${apiUrl}:${apiMethod}`, originalDto);
            }
        }
    }
}

/**
 * 解析swagger下definitions对象
 */
ApiFileJson.prototype.eachRenderDto = function (definitions?: Record<string, DefinitionsType>) {
    if (!definitions) return Promise.reject("definitions is null");
    for (let dto in definitions) {
        const { type, properties } = definitions[dto];
        switch(type) {
            case "object": {
                // 获取键值 name -> value
                let miniProperties = Object.keys(properties || {})
                .reduce((obj, key) => {
                    return {
                        ...obj,
                        [properties[key].description]: key,
                    }
                }, {});
                this.apiDtoModuleHashMap.set(dto, {
                    properties,
                    miniProperties,
                });
                break;
            }
        }
    }
}


ApiFileJson.prototype.getApiHashMap = async function () {
    await this.initStatus;
    return this.apiHashMap;
}

// 示例 
// async function main() {
//     try{
//         const apiFileJson = new ApiFileJson();
//         const apiHashMap = await apiFileJson.getApiHashMap();
//         /payment-bill/save:post  --> api:请求方式
//         let test = apiHashMap.get('/payment-bill/save:post');
//         console.log(test);
//     }
//     catch (err) {
//         console.error(err);
//     }
// }

// main();