const fs = require('fs');

let defaultFilePath = 'C:\\Users\\mingrui\\Desktop\\note\\api\\test.json'

type ApiFileJsonInstance = {
    apiHashMap: Map<string, any>;
    apiDtoModuleHashMap: Map<string, any>;
    filePath: string;
    initStatus: Promise<Map<string, any>>;
    initPromise: Promise<any>;

    init: () => Promise<void>;
    readFile: (filePath: string) => Promise<string>;
    eachApiPaths: (paths: any) => void; // 此处的 any 应替换为实际参数类型
    eachRenderDto: (definitions: any) => void; // 此处的 any 应替换为实际参数类型
    getApiHashMap: () => Promise<Map<string, any>>;
    // 其他可能的方法...
};

type ApiFileJsonConstructor = {
    new(props?: any): ApiFileJsonInstance;
};

export const ApiFileJson: ApiFileJsonConstructor = function (this: ApiFileJsonInstance, props:any = {}) {
    if (!(this instanceof ApiFileJson)) {
        throw new Error('Constructor must be called with new keyword');
    }
    const { filePath } = props;
    this.apiHashMap = new Map();
    this.apiDtoModuleHashMap = new Map();
    this.filePath = filePath || defaultFilePath;

    const init = async () => {
        try {
            const data = await this.readFile(this.filePath);
            const { paths, definitions } = JSON.parse(data);
            this.eachRenderDto(definitions);
            this.eachApiPaths(paths);
            return this.apiHashMap; // 返回 apiHashMap
        } catch (err) {
            console.error(err);
            throw err; // 抛出错误
        }
    };

    this.initStatus = init();
} as any;

ApiFileJson.prototype.readFile = function (filePath?: string) {
    filePath = filePath || this.filePath;
    let resolve: any, reject: any;
    const promise = new Promise((x, y) => { resolve = x; reject = y; });
    fs.readFile(filePath, 'utf8', (err: any, data: any) => {
        if (err) {
            reject(err);
        }
        resolve(data);
    })
    return promise;
}

ApiFileJson.prototype.eachApiPaths = function (paths: any) {
    if (!paths) return;
    for (let apiUrl in paths) {
        for (let apiMethod in paths[apiUrl]) {
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

ApiFileJson.prototype.eachRenderDto = function (definitions: any) {
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

async function main() {
    try{
        const apiFileJson = new ApiFileJson();
        const apiHashMap = await apiFileJson.getApiHashMap();
        let test = apiHashMap.get('/payment-bill/save:post');
        console.log(test);
    }
    catch (err) {
        console.error(err);
    }
}

main();