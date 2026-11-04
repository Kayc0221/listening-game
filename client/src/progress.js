// progress.js — 收集進度的計算方式 (ProgressBar 與 GameSelector 共用；刻意不 import 其他模組，避免改變 CSS 載入順序)
// 一次冒險 = 噪音峽谷 3 + 音速競技場 4 + ㄅㄅ森林前段 5 + 文字海 2 關。四個題庫剛好都是 36 次冒險的份量
// ㄅㄅ森林後段 (gameType 5) 不算：它的題庫只夠 18 次，而且卡在後段時前面玩的關卡也應該要算到
export const LEVELS_PER_SESSION = 3 + 4 + 5 + 2;
export const TOTAL_SESSIONS = 36;

// 計入進度的關卡數 (playedGames 是玩過的 gameId 陣列，例如 "1-25")
export const countedLevels = (playedGames) =>
    (playedGames || []).filter((id) => String(id).split('-')[0] !== '5').length;

// 已完成幾次冒險 (只算完整的一次)
export const completedSessions = (playedCount) => Math.floor(playedCount / LEVELS_PER_SESSION);
