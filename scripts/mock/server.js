// 本機 mock 後端：在 Node 裡執行 apps-script/Code.gs，試算表改用記憶體中的表格
// 用法：node scripts/mock/server.js   (預設 http://localhost:3010，測試帳號 test / test)
// 前端搭配：REACT_APP_API_URL=http://localhost:3010 npm start
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3010);
const root = path.join(__dirname, '..', '..');

// ---- 假的試算表 ----
const sheets = {};
const makeSheet = (rows) => ({
  rows,
  getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  appendRow: (row) => { rows.push(row.slice()); },
  getRange: (r, c) => ({ setValue: (v) => { rows[r - 1][c - 1] = v; } }),
});
const addSheet = (name, headers, records = []) => {
  sheets[name] = makeSheet([headers, ...records.map((rec) => headers.map((h) => (rec[h] === undefined ? '' : rec[h])))]);
};

const sha256 = (s) => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
const asCell = (v) => (Array.isArray(v) ? JSON.stringify(v) : v);

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));
const wordSea = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'data-prep', 'output2.json'), 'utf8'))
  .map((q) => ({ gameId: q.gameId, text: asCell(q.text), ans: asCell(q.ans), voice: q.voice }));

addSheet('users', ['username', 'password_sha256'], [{ username: 'test', password_sha256: sha256('test') }]);
addSheet('questions', ['gameId', 'text', 'ans', 'voice'], [...fixtures.questions, ...wordSea]);
addSheet('tips', ['index', 'class', 'tip'], fixtures.tips);
addSheet('scores', ['timestamp', 'username', 'gameId', 'score']);

// ---- 假的 Apps Script 全域物件 ----
const context = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({ getSheetByName: (name) => sheets[name] || null }),
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: (content) => ({ content, setMimeType() { return this; } }),
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    // Apps Script 回傳的是有號 byte 陣列
    computeDigest: (alg, text) => Array.from(crypto.createHash(alg).update(text, 'utf8').digest(), (b) => (b > 127 ? b - 256 : b)),
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  console,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8'), context, { filename: 'Code.gs' });

// ---- HTTP ----
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const output = req.method === 'POST'
      ? context.doPost({ postData: { contents: body } })
      : context.doGet({ parameter: Object.fromEntries(url.searchParams) });
    const result = JSON.parse(output.content);
    const label = req.method === 'POST' ? JSON.parse(body || '{}').action : url.searchParams.get('action');
    console.log(`${req.method} ${label} -> ${result && result.error ? `error ${result.status}: ${result.error}` : 'ok'}`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(output.content);
  });
}).listen(PORT, () => console.log(`Mock backend on http://localhost:${PORT} (user: test / test)`));
