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
// 每位學生的統計 (玩過的題目、分數總和) 存在 CacheService，不用每次請求都讀整張 scores 工作表
var SUMMARY_TTL_SECONDS = 21600; // 6 小時 (CacheService 的上限)；過期後下一次請求會重新讀表

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
  return Object.keys(userSummary_(username).played);
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
  var summary = userSummary_(username);
  return summary.count ? summary.sum / summary.count : DEFAULT_AVERAGE_SCORE;
}

// scoreInfo 格式沿用舊後端："<gameId> : <score>"
function updateScore_(username, scoreInfo) {
  var match = /^\s*(\S+)\s*:\s*(-?[\d.]+)\s*$/.exec(String(scoreInfo || ''));
  if (!username || !match) throw httpError_(400, 'Bad score: ' + scoreInfo);
  if (!findRow_(readTable_('users'), 'username', username)) throw httpError_(403, 'Unknown user');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    appendTextRow_('scores', [new Date(), username, match[1], Number(match[2])], ['yyyy-mm-dd hh:mm:ss', '@', '@', '0.##']);
    // 快取裡有這位學生的統計就順便更新；沒有的話下一次讀取時會從工作表重建 (已包含這一筆)
    var cache = CacheService.getScriptCache();
    var cached = cache.get(summaryKey_(username));
    if (cached) {
      var summary = JSON.parse(cached);
      addScoreToSummary_(summary, match[1], match[2]);
      cache.put(summaryKey_(username), JSON.stringify(summary), SUMMARY_TTL_SECONDS);
    }
  } finally {
    lock.releaseLock();
  }
  return { success: true };
}

// ---- 每位學生的統計快取 ----

function summaryKey_(username) {
  return 'summary:' + String(username);
}

function addScoreToSummary_(summary, gameId, score) {
  summary.played[String(gameId)] = 1;
  var n = Number(score);
  if (!isNaN(n)) {
    summary.sum += n;
    summary.count += 1;
  }
}

// { played: { gameId: 1, ... }, sum, count }；快取沒有時讀一次 scores 工作表重建。
// 重建和寫入分數都在同一把鎖裡進行，重建時不會漏掉同時寫入的分數
function userSummary_(username) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(summaryKey_(username));
  if (cached) return JSON.parse(cached);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    cached = cache.get(summaryKey_(username));
    if (cached) return JSON.parse(cached);
    var summary = { played: {}, sum: 0, count: 0 };
    readTable_('scores').forEach(function (s) {
      if (String(s.username) === String(username)) addScoreToSummary_(summary, s.gameId, s.score);
    });
    cache.put(summaryKey_(username), JSON.stringify(summary), SUMMARY_TTL_SECONDS);
    return summary;
  } finally {
    lock.releaseLock();
  }
}

// 手動修改或刪除 scores / users 工作表後清除快取，否則最多 6 小時內還會用舊的統計
function clearSummaryCache() {
  var keys = readTable_('users').map(function (u) { return summaryKey_(u.username); });
  if (keys.length) CacheService.getScriptCache().removeAll(keys);
}

// 在試算表上手動編輯 scores 或 users 時自動清除快取 (程式寫入不會觸發)
function onEdit(e) {
  try {
    var name = e && e.range && e.range.getSheet().getName();
    if (name === 'scores' || name === 'users') clearSummaryCache();
  } catch (err) {
    // 清除失敗也不影響編輯；可以從選單「清除成績快取」手動清除
  }
}

// ---- 試算表工具 ----

function sheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw httpError_(500, 'Missing sheet: ' + name);
  return sheet;
}

// 先設定儲存格格式再寫入：試算表會把 "4-1" 這種文字自動轉成日期 (4 月 1 日)
// formats 用 '@' 表示純文字
function appendTextRow_(name, row, formats) {
  var sheet = sheet_(name);
  var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormats([formats]);
  range.setValues([row]);
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
    .addItem('建立 / 修正工作表', 'setupSheets')
    .addItem('清除成績快取 (手動修改成績後)', 'clearSummaryCache')
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
      sheet.getRange(i + 1, 2).setNumberFormat('@').setValue(sha256_(password));
      return;
    }
  }
  appendTextRow_('users', [username, sha256_(password)], ['@', '@']);
}

// 建立缺少的工作表，並把 ID 類的欄位設成純文字 (已存在的工作表也會套用)
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var layout = {
    users: { headers: ['username', 'password_sha256'], textColumns: ['A', 'B'] },
    questions: { headers: ['gameId', 'text', 'ans', 'voice'], textColumns: ['A', 'B', 'C', 'D'] },
    tips: { headers: ['index', 'class', 'tip'], textColumns: ['B', 'C'] },
    scores: { headers: ['timestamp', 'username', 'gameId', 'score'], textColumns: ['B', 'C'] },
  };
  Object.keys(layout).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(layout[name].headers);
    }
    layout[name].textColumns.forEach(function (col) {
      sheet.getRange(col + ':' + col).setNumberFormat('@');
    });
  });
}
