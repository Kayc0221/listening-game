import React, { useEffect, useState } from 'react';
import './ProgressBar.css'; // 確保你有一個 CSS 文件名為 ProgressBar.css

import { getPlayedGames } from '../api';

// 進度以「完成幾次冒險」計算：一次冒險 = 四個遊戲的所有關卡
// (噪音峽谷 3 + 音速競技場 4 + 文字海 2 + ㄅㄅ森林 13)，全部共 36 次
const LEVELS_PER_SESSION = 3 + 4 + 2 + 13;
const TOTAL_SESSIONS = 36;

const ProgressBar = ({ username }) => {
    const [progress, setProgress] = useState(0);
    const totalGames = TOTAL_SESSIONS;

    const fetchProgress = async () => {
        try {
            const data = await getPlayedGames(username);
            const playedGames = data.playedGames || [];
            setProgress(playedGames.length / LEVELS_PER_SESSION);
        } catch (error) {
            console.error('Error fetching played games:', error);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [username]);

    const fillStyle = {
        height: `${(progress / totalGames) * 100}%`, // 根據比例計算填充高度
        bottom: '0', // 從底部開始填充
    };

    return (
        <div className="progressBar-container fade-in-and-grow">
            <span className="progress-text2">收集進度</span>
            <img
                src="/image/progress.svg" // 確保路徑正確
                alt="Progress"
                className="progress-svg"
            />
            <div className="progressBar-fill" style={fillStyle}></div>
            <div className="progress-text">
                {`${Math.round(progress)}/${totalGames}`}
            </div>
        </div>
    );
};

export default ProgressBar;
