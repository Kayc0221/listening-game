// Code.gs — 聽覺訓練遊戲的後端：Google Apps Script 網頁應用程式 + Google 試算表
//
// 試算表需要四個工作表 (第一列為標題)：
//   users     : username | password_sha256
//   questions : gameId | text | ans | voice          (gameId 例如 "4-1"，"-" 前面的數字就是 gameType)
//   tips      : index | class | tip
//   scores    : timestamp | username | gameId | score (由遊戲自動寫入)
// text / ans 若是多個值，用 JSON 陣列表示，例如 ["曬記皮膚","夏天到了…"]
//
// 部署：擴充功能 → Apps Script → 貼上本檔 → 部署 → 新增部署作業 → 網頁應用程式，
//       執行身分「我」、存取權「所有人」，把網址填到前端的 REACT_APP_API_URL。

// 每個 gameType 一次冒險要玩幾關
var LEVELS_PER_GAME = { '1': 3, '2': 4, '3': 5, '4': 2, '5': 8 };
var DEFAULT_AVERAGE_SCORE = 5;

// ---- HTTP 入口 ----

function doGet(e) {
  return respond_(function () {
    var p = e.parameter || {};
    switch (p.action) {
      case 'getGameDatas': return getGameData_(p.gameId);
      case 'getTips': return getTip_(p['class']);
      case 'getPlayedGames': return { playedGames: getPlayedGames_(p.username) };
      case 'selectRandomGames': return selectRandomGames_(p.username, p.gameType);
      case 'getAvarageScore': return getAverageScore_(p.username);
      default: throw httpError_(404, 'Unknown action: ' + p.action);
    }
  });
}

// POST 的 body 以 text/plain 送出 JSON (避免瀏覽器的 CORS preflight，Apps Script 不支援)
function doPost(e) {
  return respond_(function () {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}');
    switch (body.action) {
      case 'login': return login_(body.username, body.password);
      case 'updateScore': return updateScore_(body.username, body.scoreInfo);
      default: throw httpError_(404, 'Unknown action: ' + body.action);
    }
  });
}

function respond_(handler) {
  var result;
  try {
    result = handler();
  } catch (err) {
    result = { error: String(err.message || err), status: err.status || 500 };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function httpError_(status, message) {
  var err = new Error(message);
  err.status = status;
  return err;
}

// ---- 動作 ----

function login_(username, password) {
  var user = findRow_(readTable_('users'), 'username', username);
  return { success: !!user && user.password_sha256 === sha256_(password) };
}

function getGameData_(gameId) {
  var q = findRow_(readTable_('questions'), 'gameId', gameId);
  if (!q) throw httpError_(404, 'No question ' + gameId);
  return [parseCell_(q.text), parseCell_(q.ans), String(q.voice || q.gameId)];
}

function getTip_(tipClass) {
  var tips = readTable_('tips').filter(function (t) { return String(t['class']) === String(tipClass); });
  if (!tips.length) throw httpError_(404, 'No tips for class ' + tipClass);
  var tip = tips[Math.floor(Math.random() * tips.length)];
  return { tip: String(tip.tip), index: Number(tip.index) };
}

function getPlayedGames_(username) {
  var played = {};
  readTable_('scores').forEach(function (s) {
    if (String(s.username) === String(username)) played[String(s.gameId)] = true;
  });
  return Object.keys(played);
}

// 從這個 gameType 還沒玩過的題目中隨機挑幾關；全部玩過時回傳 404
function selectRandomGames_(username, gameType) {
  var count = LEVELS_PER_GAME[String(gameType)];
  if (!count) throw httpError_(400, 'Unknown gameType ' + gameType);
  var played = getPlayedGames_(username);
  var candidates = readTable_('questions')
    .map(function (q) { return String(q.gameId); })
    .filter(function (id) { return id.split('-')[0] === String(gameType) && played.indexOf(id) === -1; });
  if (!candidates.length) throw httpError_(404, 'No more games for type ' + gameType);
  return { selectedGames: shuffle_(candidates).slice(0, count) };
}

// 所有已記錄分數 (0-10) 的平均，用來調整難度
function getAverageScore_(username) {
  var scores = readTable_('scores')
    .filter(function (s) { return String(s.username) === String(username); })
    .map(function (s) { return Number(s.score); })
    .filter(function (n) { return !isNaN(n); });
  if (!scores.length) return DEFAULT_AVERAGE_SCORE;
  return scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
}

// scoreInfo 格式沿用舊後端："<gameId> : <score>"
function updateScore_(username, scoreInfo) {
  var match = /^\s*(\S+)\s*:\s*(-?[\d.]+)\s*$/.exec(String(scoreInfo || ''));
  if (!username || !match) throw httpError_(400, 'Bad score: ' + scoreInfo);
  if (!findRow_(readTable_('users'), 'username', username)) throw httpError_(403, 'Unknown user');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_('scores').appendRow([new Date(), username, match[1], Number(match[2])]);
  } finally {
    lock.releaseLock();
  }
  return { success: true };
}

// ---- 試算表工具 ----

function sheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw httpError_(500, 'Missing sheet: ' + name);
  return sheet;
}

// 把工作表讀成物件陣列，key 是第一列的標題
function readTable_(name) {
  var values = sheet_(name).getDataRange().getValues();
  var headers = values.shift() || [];
  return values
    .filter(function (row) { return row.some(function (cell) { return cell !== ''; }); })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[String(h).trim()] = row[i]; });
      return obj;
    });
}

function findRow_(rows, key, value) {
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][key]) === String(value)) return rows[i];
  }
  return null;
}

function parseCell_(value) {
  var s = String(value);
  if (s.charAt(0) === '[') {
    try { return JSON.parse(s); } catch (e) { /* 不是 JSON，當作一般文字 */ }
  }
  return s;
}

function shuffle_(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = array[i]; array[i] = array[j]; array[j] = tmp;
  }
  return array;
}

function sha256_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text || ''), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// ---- 管理選單：在試算表上方出現「遊戲管理」，用來新增學生 (密碼只存雜湊值) ----

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('遊戲管理')
    .addItem('新增 / 重設學生帳號', 'promptAddUser')
    .addItem('建立缺少的工作表', 'setupSheets')
    .addToUi();
}

function promptAddUser() {
  var ui = SpreadsheetApp.getUi();
  var name = ui.prompt('學生帳號', '請輸入帳號', ui.ButtonSet.OK_CANCEL);
  if (name.getSelectedButton() !== ui.Button.OK || !name.getResponseText().trim()) return;
  var pw = ui.prompt('學生密碼', '請輸入密碼 (只會儲存雜湊值)', ui.ButtonSet.OK_CANCEL);
  if (pw.getSelectedButton() !== ui.Button.OK || !pw.getResponseText()) return;
  setUser_(name.getResponseText().trim(), pw.getResponseText());
  ui.alert('已儲存帳號 ' + name.getResponseText().trim());
}

function setUser_(username, password) {
  var sheet = sheet_('users');
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === username) {
      sheet.getRange(i + 1, 2).setValue(sha256_(password));
      return;
    }
  }
  sheet.appendRow([username, sha256_(password)]);
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var layout = {
    users: ['username', 'password_sha256'],
    questions: ['gameId', 'text', 'ans', 'voice'],
    tips: ['index', 'class', 'tip'],
    scores: ['timestamp', 'username', 'gameId', 'score'],
  };
  Object.keys(layout).forEach(function (name) {
    if (!ss.getSheetByName(name)) ss.insertSheet(name).appendRow(layout[name]);
  });
}
