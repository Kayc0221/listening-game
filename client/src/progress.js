// progress.js — 收集進度的計算方式 (ProgressBar 與 GameSelector 共用；刻意不 import 其他模組，避免改變 CSS 載入順序)
// 一次冒險 = 四個遊戲的所有關卡：噪音峽谷 3 + 音速競技場 4 + 文字海 2 + ㄅㄅ森林 13 (5 + 8)
export const LEVELS_PER_SESSION = 3 + 4 + 2 + 13;
export const TOTAL_SESSIONS = 36;

// 已完成幾次冒險 (只算完整的一次)
export const completedSessions = (playedCount) => Math.floor(playedCount / LEVELS_PER_SESSION);
