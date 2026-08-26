import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = 'C:/Users/340710/Downloads/曲靖国家级零碳园区能碳管理平台_产品级功能清单_管委会企业服务视角完善版.xlsx';
const outDir = 'D:/Project/QuJin_Energy_Carbon_Platform/workbook_edit/inspect';
await fs.mkdir(outDir, { recursive: true });
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({ kind:'workbook,sheet,table', maxChars:12000, tableMaxRows:8, tableMaxCols:12, tableMaxCellChars:100 });
console.log(summary.ndjson);
const sheets = workbook.worksheets.items;
for (const sheet of sheets) {
  console.log(`SHEET:${sheet.name}`);
  const used = sheet.getUsedRange();
  console.log((await workbook.inspect({ kind:'region', sheetId:sheet.name, range:used.address, maxChars:12000 })).ndjson);
  const preview = await workbook.render({ sheetName:sheet.name, autoCrop:'all', scale:1, format:'png' });
  await fs.writeFile(`${outDir}/${sheet.name.replace(/[\\/:*?"<>|]/g,'_')}.png`, new Uint8Array(await preview.arrayBuffer()));
}
