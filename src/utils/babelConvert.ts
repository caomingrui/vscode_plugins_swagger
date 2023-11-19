import type { DeletionLabelsType, ReplaceTargetValueProps } from '../interface/index';
import * as vscode from 'vscode';
import * as t from '@babel/types';
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
async function babelConvert(
    originCodeString: string, 
    dtoHashMap: Record<string, string>, 
    selectionRecords: vscode.Range
): Promise<{
    code: string,
    deletionLabels: DeletionLabelsType
}> {
    const ast = parser.parse(originCodeString, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript']
    });
    let selectTextObj: any = null;
    const { isEmpty, start, end } = selectionRecords;
    // 存在选中区域
    if (!isEmpty) {
        selectTextObj = {
            start: { ...start, line: start.line + 1 },
            end: { ...end, line: end.line + 1 }
        };
    }
      
    traverse(ast, {
        JSXOpeningElement: {
            enter(path: any) {
                // const elemName = path.node.name.name;
                const elemAttributes = path.node.attributes;
                const hasLabelElm = elemAttributes.find((element: t.JSXAttribute) => {
                    return element.name.name === 'label'
                })
                if (!hasLabelElm) return;
                const hasNameElm = elemAttributes.find((element: t.JSXAttribute) => {
                    return element.name.name === 'name'
                })
                let elemNameValue = hasLabelElm.value.value;
                if (selectTextObj) {
                    const { 
                        start: { line: selectStartLine },
                        end: { line: selectEndLine }
                    } = selectTextObj;
                    let jsxLocStartLine = path.node.loc.start.line;
                    // 选中区域不在jsx标签内 跳出
                    if (jsxLocStartLine < selectStartLine || jsxLocStartLine > selectEndLine) {
                        return;
                    }
                }
                
                replaceTargetValue({
                    elemDtoHashValue: dtoHashMap[elemNameValue],
                    targetElement: hasNameElm,
                    elemLabelName: elemNameValue,
                    loc: hasLabelElm.loc
                });
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


/**
 * 替换目标label value
 * @param param0 
 * @returns 
 */
function replaceTargetValue({
    elemDtoHashValue,
    targetElement,
    elemLabelName,
    loc
}: ReplaceTargetValueProps) {
    if (!targetElement.value) return;
    let jsxNameElmVal = targetElement.value as t.StringLiteral;
    if (!jsxNameElmVal.value) return;
    if (elemDtoHashValue) {
        jsxNameElmVal.value = elemDtoHashValue;
    } else {
        (babelConvert as any).deletionLabels.push({
            name: elemLabelName,
            loc
        });
    }
}
(babelConvert as any).deletionLabels = [];

export default babelConvert;