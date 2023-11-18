import type { DeletionLabelsType } from '../interface/index'
const babel = require("@babel/core");
const {default: jsxSyntax} = require("@babel/plugin-syntax-jsx");
/**
 * babel 转换
 * @param originCodeString 
 * @returns 
 */
function babelConvert(originCodeString: string, dtoHashMap: any): {
    code: string,
    deletionLabels: DeletionLabelsType
  } {
      const result = babel.transformSync(originCodeString, {
        plugins: [myPlugins.bind(null, dtoHashMap)],
      });
      return {
        code: result.code,
        deletionLabels: (babelConvert as any).deletionLabels
      };
    }
  (babelConvert as any).deletionLabels = [];
    
    function myPlugins(dtoHashMap: any) {
      return {
        inherits: jsxSyntax,
        visitor: {
          JSXOpeningElement: {
            enter(path: any) {
                // const elemName = path.node.name.name;
                const elemAttributes = path.node.attributes;
                const hasLabelElm: any = elemAttributes.find((element: any) => {
                    return element.name.name === 'label'
                })
                if (!hasLabelElm) return;
                const hasNameElm = elemAttributes.find((element: any) => {
                    return element.name.name === 'name'
                })
                let elemNameValue = hasLabelElm.value.value;
                // let oldValue = hasNameElm.value.value;
                if (dtoHashMap[elemNameValue]) {
                  hasNameElm.value.value = dtoHashMap[elemNameValue]
                }
                else {
                  (babelConvert as any).deletionLabels.push({
                    name: elemNameValue,
                    loc: hasLabelElm.loc
                  });
                }
                // console.log('--->>>>', hasLabelElm)
              //   types.addComment(path.node, "leading", `${oldValue} -> test`);
            },
          },
        },
      };
    }

    export default babelConvert;