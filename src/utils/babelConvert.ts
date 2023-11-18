import type { DeletionLabelsType } from '../interface/index'
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator');
const { format } = require('prettier');

/**
 * babel 转化
 * @param originCodeString 
 * @param dtoHashMap 
 * @returns 
 */
async function babelConvert(originCodeString: string, dtoHashMap: any): Promise<{
    code: string,
    deletionLabels: DeletionLabelsType
}> {
    const ast = parser.parse(originCodeString, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript']
    });
      
    traverse(ast, {
        JSXOpeningElement: {
            enter(path: any) {
                // const elemName = path.node.name.name;
                const elemAttributes = path.node.attributes;
                const hasLabelElm = elemAttributes.find((element: any) => {
                    return element.name.name === 'label'
                })
                if (!hasLabelElm) return;
                const hasNameElm = elemAttributes.find((element: any) => {
                    return element.name.name === 'name'
                })
                let elemNameValue = hasLabelElm.value.value;
                if (dtoHashMap[elemNameValue]) {
                    hasNameElm.value.value = dtoHashMap[elemNameValue]
                } else {
                    (babelConvert as any).deletionLabels.push({
                        name: elemNameValue,
                        loc: hasLabelElm.loc
                    });
                }
            },
        }
    });

      
    const { code } = generator.default(ast, {
        // 保留原代码
        retainTrailingComma: true,
        retainLines: true,
    }, originCodeString);
    
      // 格式化prettier风格
    let formattedCode = await format(code, {
        parser: "typescript",
        // 取消单音符替换双音符
        singleQuote: true,
        // 尾部逗号不处理
        trailingComma: "es5",
    });
    return {
        code: formattedCode,
        deletionLabels: (babelConvert as any).deletionLabels
    };
}
(babelConvert as any).deletionLabels = [];

export default babelConvert;