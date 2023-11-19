// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { ApiFileJson } from './utils/apiFileJson'
import babelConvert from './utils/babelConvert';
import { getApiInputRecords } from './utils/index';
const types = require('@babel/types');
const fs = require('fs');
import * as t from '@babel/types';
const babel = require('@babel/core');
const { format } = require('prettier');

let documentMetadata = '__API__';

type LocType =  {
  start: {line: number, column: number}, 
  end: {line: number, column: number}
}

type CustomDocumentsType = {
  metadata: string,
  // 更改样式
  dispatchTextDecorations: (...args: any[]) => vscode.TextEditorDecorationType,
  // 样式
  decorationTypes: vscode.TextEditorDecorationType[],
  // 缺失字段
  deletionLabels: DeletionLabelsType
}

type DeletionLabelsType = {
  name: string,
  loc: LocType
}[]

// api 信息文档Map
let customDocuments: Map<vscode.TextDocument, CustomDocumentsType> = new Map();
// 抓取地址缓存
let swaggerHashMap = new Map();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "plugins-interface" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('plugins-interface.demo', async (...args) => {
        const apiInput = await vscode.window.showInputBox({ prompt: 'Enter something:', placeHolder: '输入api接口地址' });
        // apiInput --> transform:/payment-bill/save:post
        if (!apiInput) {
          return vscode.window.showWarningMessage('请输入api接口地址！！');
        }
        const { operationType, apiUrl, method } = getApiInputRecords(apiInput);

        // 解析api 地址 获取参数集合
        const inputApiFields = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "正在解析目标api字段...",
            // 如果设置为 true，将允许用户取消操作
            cancellable: false 
        }, async (progress) => {
          const apiFileJson = new ApiFileJson();
          let apiHashMap = await apiFileJson.getApiHashMap();
          const inputApi = apiHashMap.get(`${apiUrl}:${method}`);
          let inputApiFields = {};
          if (inputApi) {
            inputApiFields = inputApi.miniProperties;
          }
          return inputApiFields;
        });
        
        const activeTextEditor = vscode.window.activeTextEditor;
        (babelConvert as any).deletionLabels = [];
        if (!activeTextEditor) return;
        // 根据不同type 生成不同操作
        let operationRecords = null;
        switch(operationType) {
          case 'replace':
          case '替换':
            operationRecords = {
              type: 'replace'
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

        // if (activeTextEditor) {
          // 获取选中文本
          const selection = activeTextEditor.selection;
          // 处理文本， 存在选中取用选中 否则当前文件全局文本内容
          const originalText = activeTextEditor.document.getText();
          const { code: transformedText, deletionLabels } = await babelConvert(
            originalText, 
            inputApiFields,
            selection,
            operationRecords,
          );
          console.log(operationRecords);
          const apiDocument = await renderApiDocument(operationRecords, deletionLabels)
          // 生成api接口信息（缺失字段|参数ts约束|生成请求函数）
          const apiTextDocument = await setContent(apiDocument, { language: activeTextEditor.document.languageId });

          if(operationRecords.type === "replace") {
            // 创建打开 babel 转换后的文档
            const transformedDocument = await vscode.workspace.openTextDocument({
                language: activeTextEditor.document.languageId,
                content: transformedText,
            });
          
            // 创建diff视图
            vscode.commands.executeCommand('vscode.diff', transformedDocument.uri, activeTextEditor.document.uri, '比对字段更改')
          }

          const dispatchTextDecorations = setTextDecorations.bind(null, activeTextEditor);
          // 缓存api 文档
          customDocuments.set(apiTextDocument.document, {
            metadata: documentMetadata,
            ...customDocuments.get(activeTextEditor.document),
            dispatchTextDecorations,
            // 操作的样式
            decorationTypes: [],
            deletionLabels
          })


          // 监听当前焦点所在文档
          vscode.window.onDidChangeTextEditorSelection((e) => {
            if (e.textEditor.viewColumn === vscode.ViewColumn.Two) {
              if (!customDocuments.has(e.textEditor.document)) return;
              const { metadata, deletionLabels } = customDocuments.get(e.textEditor.document) || {};
              // 针对documentMetadata 类型文档操作
              // 选择缺失字段更改醒目样式
              if (metadata === documentMetadata) {
                const selectedText = e.textEditor.document.getText(e.selections[0]);
                const checkDeletionLabel = deletionLabels?.find(label => label.name === selectedText);
                // 设置前重置样式
                customDocuments.get(e.textEditor.document)?.decorationTypes.forEach(l => l.dispose());
                // 为所有缺失字段设置默认样式
                deletionLabels?.forEach(checkDeletionLabel => {
                    const decorationType = dispatchTextDecorations(checkDeletionLabel, {
                      backgroundColor: '#845ef7',
                    })
                    customDocuments.get(e.textEditor.document)?.decorationTypes.push(decorationType);
                })
                if (!selectedText.length || !checkDeletionLabel) return
                // 为选中字段设置高亮样式
                const decorationType = dispatchTextDecorations(checkDeletionLabel, {
                  backgroundColor: '#e8590c',
                  border: '2px solid red'
                })
                customDocuments.get(e.textEditor.document)?.decorationTypes.push(decorationType);
              }
            }
          });
      // }
	});

  // 监听文档关闭
  const documentCloseListener = vscode.workspace.onDidCloseTextDocument((closedDocument) => {
    // 在文档关闭时执行操作
    console.log(`Document closed: ${closedDocument.fileName}`, customDocuments.get(closedDocument));
    const customDocument = customDocuments.get(closedDocument)
    if (customDocument) {
      // 重置样式
      customDocument.decorationTypes.forEach(l => l.dispose());
      customDocuments.delete(closedDocument);
    } 
  });

	context.subscriptions.push(disposable, documentCloseListener);
}

/**
 * 设置文档样式
 * @param activeTextEditor 文档对象
 * @param checkDeletionLabel 文档 loc 对象, 需要更改开始结束行列
 * @param editorDecorationType 样式
 * @returns decorationType 方便后续撤销样式
 */
function setTextDecorations (activeTextEditor: vscode.TextEditor, checkDeletionLabel: {
  loc: LocType
}, editorDecorationType: vscode.DecorationRenderOptions): vscode.TextEditorDecorationType {
  const {loc} = checkDeletionLabel;
  const {start, end} = loc;
  const rangeToHighlight = new vscode.Range(
    // 起始行和列
    new vscode.Position(start.line - 1, start.column),
    // 终止行和列
    new vscode.Position(end.line - 1, end.column)   
  );
  // 设置高亮样式
  let decorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
      ...editorDecorationType
  });
  activeTextEditor.setDecorations(decorationType, [rangeToHighlight]);
  return decorationType;
}

/**
 * 创建文档对象
 * @param content 文档内容
 * @param options 
 * @returns 
 */
function setContent(content: string, options: {
  language?: string;
}) {
  options = options || {
      language: 'text'
  };

  return vscode.workspace.openTextDocument({ language: options.language })
      .then(doc => vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Two, preview: false }))
      .then(editor => {
        let editBuilder = (textEdit: vscode.TextEditorEdit) => {
            textEdit.insert(new vscode.Position(0, 0), String(content));
        };

        return editor.edit(editBuilder, {
          undoStopBefore: true, 
          undoStopAfter: false
        }).then(() => editor);
    });

}

let apiDtoHashMap: any = {
  "公司": 'abs',
  "部门名称": 'qwe',
  "票据号码": 'www',
  "票据台帐号": 'ert',
  // "票据类型": 'wwrewr',
  // "票据来源": 'oooo',
};

const apiUrl = 'http://localhost:3000';


/**
 * 生成api 信息文档
 */
async function renderApiDocument(operationRecords: any, deletionLabels: DeletionLabelsType) {
  const { type: operationType } = operationRecords;
  let outPutText = '';
  switch (operationType) {
    case 'replace':
      outPutText = `// 选中字段高亮
      // 缺失字段 --> ${deletionLabels.map(l => l.name).join()}`
      break;
    case 'transform':
      let str = `
      // 转换对象
      let data = {};
      const transformData = {`;
      Object.keys(operationRecords.transformData).forEach(res => {
        let transformDataItem = operationRecords.transformData[res];
        str += `
        // ${transformDataItem.name}
        ${res}: data.${transformDataItem.value},` 
      })
      str += '}'
      outPutText = str;
      break;
  }
  let formattedCode = await format(outPutText, {
      parser: "typescript",
      // 取消单音符替换双音符
      singleQuote: true,
      // 尾部逗号不处理
      trailingComma: "es5",
  });
  return formattedCode;
}


/**
 * 获取api 文档 
 * url
 * methods
 * param
 * @param url 
 * @returns 
 */
async function generateApiMap (url: string) {
  if (!url) return;

  const apiUrl = 'http://192.168.0.134:18000/zmdms-scm-accounting/v2/api-docs';
  
  // const { data } = await axios.get(apiUrl, {
  //   headers: {
  //     'Accept': 'application/json, text/plain, */*',
  //     'Accept-Language': 'zh-CN,zh;q=0.9,ar;q=0.8',
  //     'Cache-Control': 'no-cache',
  //     'Connection': 'keep-alive',
  //     'Pragma': 'no-cache',
  //     'Referer': 'http://192.168.0.134:18000/doc.html',
  //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  //     'knfie4j-gateway-request': 'fefcdaf0277e10d3925896e15ba80117',
  //     'knife4j-gateway-code': 'ROOT',
  //     'language': 'zh-CN'
  //   }
  // })
  // console.log(data)
  // let namePathRecords = data.paths[url];
  // namePathRecords = namePathRecords.get || namePathRecords.post

  const apiFile = fs.readFileSync(new URL('C://Users/mingrui/Desktop/note/api/test.json'));
  const data = JSON.parse(apiFile.toString());

  // const responsesRecords = namePathRecords.responses
  // const {$ref, originalRef} = responsesRecords[200].schema
  // const apiDto = data.definitions[originalRef];

  // const resDto = renderDto(apiDto, data.definitions);
  // apiDtoHashMap = resDto.data;
}

// This method is called when your extension is deactivated
export function deactivate() {}
