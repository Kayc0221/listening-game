import React, { useEffect, useState } from 'react';
import './ProgressBar.css';

import { getPlayedGames } from '../api';
import { asset } from '../asset';
import { useAuth } from '../contexts/AuthContext';
import { LEVELS_PER_SESSION, TOTAL_SESSIONS, completedSessions } from '../progress';

const ProgressBar = ({ username }) => {
    const [playedCount, setPlayedCount] = useState(0);
    const { progressVersion } = useAuth(); // 每玩完一個遊戲會加一，觸發重新讀取

    useEffect(() => {
        let isMounted = true;
        getPlayedGames(username)
            .then((data) => { if (isMounted) setPlayedCount((data.playedGames || []).length); })
            .catch((error) => console.error('Error fetching played games:', error));
        return () => { isMounted = false; };
    }, [username, progressVersion]);

    const sessions = Math.min(completedSessions(playedCount), TOTAL_SESSIONS);
    // 填充高度用連續值，玩到一半的冒險也看得到一點進展
    const fillPercent = Math.min(playedCount / (LEVELS_PER_SESSION * TOTAL_SESSIONS), 1) * 100;

    return (
        <div className="progress-widget fade-in-and-grow">
            <img src={asset('/image/progress.svg')} alt="" className="progress-icon" />
            <div className="progress-body">
                <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_SESSIONS} aria-valuenow={sessions} aria-label="收集進度">
                    <div className="progress-fill" style={{ height: `${fillPercent}%` }} />
                    <span className="progress-count">{sessions}<small>/{TOTAL_SESSIONS}</small></span>
                </div>
                <span className="progress-label">收集進度</span>
            </div>
        </div>
    );
};

export default ProgressBar;
