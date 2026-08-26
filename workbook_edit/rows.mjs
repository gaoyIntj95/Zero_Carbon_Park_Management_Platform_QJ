import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/340710/Downloads/曲靖国家级零碳园区能碳管理平台_产品级功能清单_管委会企业服务视角完善版.xlsx'));
const s=wb.worksheets.getItem('产品级功能清单');
for (const [i,row] of s.getRange('A1:K38').values.entries()) console.log(i+1, JSON.stringify(row.slice(0,4)));
