const fs = require('fs');

let defaultFilePath = 'C:\\Users\\mingrui\\Desktop\\note\\api\\test.json'

export function ApiFileJson(props = {}) {
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
            console.log(this.apiHashMap.size);
            return this.apiHashMap; // 返回 apiHashMap
        } catch (err) {
            console.error(err);
            throw err; // 抛出错误
        }
    };

    this.initStatus = init();
}

ApiFileJson.prototype.readFile = function (filePath) {
    filePath = filePath || this.filePath;
    let resolve, reject;
    const promise = new Promise((x, y) => { resolve = x; reject = y; });
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data);
    })
    return promise;
}

ApiFileJson.prototype.eachApiPaths = function (paths) {
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

ApiFileJson.prototype.eachRenderDto = function (definitions) {
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