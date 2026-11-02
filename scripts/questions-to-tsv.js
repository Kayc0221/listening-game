// 把題目 JSON (例如 data-prep/output2.json) 轉成可以直接貼進試算表 questions 工作表的 TSV
// 用法：node scripts/questions-to-tsv.js scripts/data-prep/output2.json > game4.tsv
//       然後在試算表 questions 工作表 → 檔案 → 匯入 → 上傳 game4.tsv → 「附加到目前的工作表」
const fs = require('fs');

const file = process.argv[2];
if (!file) {
    console.error('Usage: node scripts/questions-to-tsv.js <questions.json>');
    process.exit(1);
}

const cell = (v) => (Array.isArray(v) ? JSON.stringify(v) : String(v ?? '')).replace(/[\t\r\n]+/g, ' ');
const questions = JSON.parse(fs.readFileSync(file, 'utf8'));
const lines = questions.map((q) => [q.gameId, cell(q.text), cell(q.ans), q.voice || q.gameId].join('\t'));
process.stdout.write(lines.join('\n') + '\n');
