type HtmlReportDownload = {
  filename: string;
  title: string;
  content: string;
};

export function downloadHtmlReport({ filename, title, content }: HtmlReportDownload) {
  const html = [
    '<!doctype html><meta charset="utf-8">',
    `<title>${title}</title>`,
    '<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:14px/1.7 Arial,"Microsoft YaHei";margin:0;color:#24333c}h1{font-size:22px}h2{margin-top:28px;font-size:18px}table{width:100%;min-width:0;border-collapse:collapse;table-layout:fixed;overflow-wrap:anywhere}th,td{border:1px solid #cad4d8;padding:8px;text-align:left;overflow-wrap:anywhere;word-break:break-word}th{background:#f3f7f5}</style>',
    `<h1>${title}</h1>`,
    content,
  ].join('');
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}


