// api.js — 所有對後端 (Cloud Function) 的請求都集中在這裡
const apiBaseUrl = process.env.REACT_APP_API_URL;

export class ApiError extends Error {
    constructor(status, path) {
        super(`Server error ${status} for ${path}`);
        this.status = status;
    }
}

const request = async (path, options) => {
    const response = await fetch(`${apiBaseUrl}${path}`, options);
    if (!response.ok) {
        throw new ApiError(response.status, path);
    }
    return response.json();
};

const query = (params) => new URLSearchParams(params).toString();

const postJson = (path, body) => request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

export const login = (username, password) =>
    postJson('/api/login', { username, password });

export const getPlayedGames = (username) =>
    request(`/api/getPlayedGames?${query({ username })}`);

export const selectRandomGames = (username, gameType) =>
    request(`/api/selectRandomGames?${query({ username, gameType })}`);

export const getGameData = (gameId) =>
    request(`/api/getGameDatas?${query({ gameId })}`);

export const getTip = (tipClass) =>
    request(`/api/getTips?${query({ class: tipClass })}`);

// 取得使用者的平均分數 (0-10)，失敗時回傳預設值 5
export const getAverageScore = async (username) => {
    try {
        return await request(`/api/getAvarageScore?${query({ username })}`);
    } catch (error) {
        console.error('Error fetching average score:', error);
        return 5;
    }
};

// 分數以 "<gameId> : <score>" 的字串格式存入 maindata
export const submitScore = async (username, gameId, score) => {
    try {
        await postJson('/maindata/updateScore', { username, scoreInfo: `${gameId} : ${score}` });
    } catch (error) {
        console.error('Error updating score:', error);
    }
};
