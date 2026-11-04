// api.js — 所有對後端 (Google Apps Script 網頁應用程式，資料存在 Google 試算表) 的請求都集中在這裡
// 後端程式碼在 apps-script/Code.gs；本機開發可用 scripts/mock/server.js
const apiBaseUrl = process.env.REACT_APP_API_URL;

export class ApiError extends Error {
    constructor(status, action, message) {
        super(`Server error ${status} for ${action}${message ? `: ${message}` : ''}`);
        this.status = status;
    }
}

// Apps Script 一律回 HTTP 200，錯誤放在 body 的 { error, status }
const handle = async (response, action) => {
    if (!response.ok) {
        throw new ApiError(response.status, action);
    }
    const data = await response.json();
    if (data && data.error) {
        throw new ApiError(data.status || 500, action, data.error);
    }
    return data;
};

// Apps Script 偶爾會卡住不回應：超過 30 秒就當作失敗，畫面會顯示「重試」而不是一直停在載入中
const REQUEST_TIMEOUT_MS = 30000;
const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const get = async (action, params = {}) => {
    const query = new URLSearchParams({ action, ...params }).toString();
    return handle(await fetchWithTimeout(`${apiBaseUrl}?${query}`), action);
};

// 用 text/plain 送 JSON：避免 CORS preflight (Apps Script 不處理 OPTIONS)，密碼也不會出現在網址裡
const post = async (action, body) => handle(await fetchWithTimeout(apiBaseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body }),
}), action);

export const login = (username, password) =>
    post('login', { username, password });

export const getPlayedGames = (username) =>
    get('getPlayedGames', { username });

export const selectRandomGames = (username, gameType) =>
    get('selectRandomGames', { username, gameType });

export const getGameData = (gameId) =>
    get('getGameDatas', { gameId });

export const getTip = (tipClass) =>
    get('getTips', { class: tipClass });

// 取得使用者的平均分數 (0-10)，失敗時回傳預設值 5
export const getAverageScore = async (username) => {
    try {
        return await get('getAvarageScore', { username });
    } catch (error) {
        console.error('Error fetching average score:', error);
        return 5;
    }
};

// 分數以 "<gameId> : <score>" 的字串格式存入試算表的 scores 工作表
export const submitScore = async (username, gameId, score) => {
    try {
        await post('updateScore', { username, scoreInfo: `${gameId} : ${score}` });
    } catch (error) {
        console.error('Error updating score:', error);
    }
};
