// 本機 mock 後端：在 Node 裡執行 apps-script/Code.gs，試算表改用記憶體中的表格
// 用法：node scripts/mock/server.js   (預設 http://localhost:3010，測試帳號 test / test)
//       MOCK_GAMES=4 node scripts/mock/server.js   只放文字海的題目
//       MOCK_QUESTIONS=questions.tsv MOCK_TIPS=tips.tsv node scripts/mock/server.js   用 convert_banks.py 的輸出
//       MOCK_DELAY_MS=2500 node scripts/mock/server.js   每個請求延遲 2.5 秒 (接近真的 Apps Script)
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
// 只實作 Code.gs 用到的部分；儲存格格式 (setNumberFormat) 在記憶體中沒有意義，直接忽略
const makeSheet = (rows) => ({
  rows,
  getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
  getLastRow: () => rows.length,
  appendRow: (row) => { rows.push(row.slice()); },
  getRange: (r, c) => {
    const range = {
      setNumberFormat: () => range,
      setNumberFormats: () => range,
      setValue: (v) => { rows[r - 1][c - 1] = v; return range; },
      setValues: (values) => {
        values.forEach((vals, i) => {
          rows[r - 1 + i] = rows[r - 1 + i] || [];
          vals.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = v; });
        });
        return range;
      },
    };
    return range;
  },
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
// MOCK_QUESTIONS / MOCK_TIPS 指向 convert_banks.py 產生的 TSV 時，用真的題庫取代假題目
const readTsv = (file, headers) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)
  .map((line) => Object.fromEntries(line.split('\t').map((v, i) => [headers[i], v])));
const baseQuestions = process.env.MOCK_QUESTIONS
  ? readTsv(process.env.MOCK_QUESTIONS, ['gameId', 'text', 'ans', 'voice'])
  : fixtures.questions;
const tips = process.env.MOCK_TIPS ? readTsv(process.env.MOCK_TIPS, ['index', 'class', 'tip']) : fixtures.tips;

// MOCK_GAMES=4 只載入 gameType 4 的題目 (模擬其他遊戲還沒有題庫的情況)
const onlyGames = process.env.MOCK_GAMES ? process.env.MOCK_GAMES.split(',') : null;
const questions = [...baseQuestions, ...wordSea].filter((q) => !onlyGames || onlyGames.includes(q.gameId.split('-')[0]));
addSheet('questions', ['gameId', 'text', 'ans', 'voice'], questions);
addSheet('tips', ['index', 'class', 'tip'], tips);
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
  // 記憶體中的快取 (不模擬過期時間)
  CacheService: (() => {
    const store = new Map();
    const cache = {
      get: (key) => (store.has(key) ? store.get(key) : null),
      put: (key, value) => { store.set(key, String(value)); },
      remove: (key) => { store.delete(key); },
      removeAll: (keys) => { keys.forEach((key) => store.delete(key)); },
    };
    return { getScriptCache: () => cache };
  })(),
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
  // MOCK_DELAY_MS=2500 模擬真的 Apps Script 每個請求要等 2-3 秒
  req.on('end', () => setTimeout(() => {
    const output = req.method === 'POST'
      ? context.doPost({ postData: { contents: body } })
      : context.doGet({ parameter: Object.fromEntries(url.searchParams) });
    const result = JSON.parse(output.content);
    const label = req.method === 'POST' ? JSON.parse(body || '{}').action : url.searchParams.get('action');
    console.log(`${req.method} ${label} -> ${result && result.error ? `error ${result.status}: ${result.error}` : 'ok'}`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(output.content);
  }, Number(process.env.MOCK_DELAY_MS || 0)));
}).listen(PORT, () => console.log(`Mock backend on http://localhost:${PORT} (user: test / test)`));
