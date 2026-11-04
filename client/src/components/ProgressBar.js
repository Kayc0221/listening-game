import React, { useEffect, useRef, useState } from 'react';
import './ProgressBar.css';

import { getPlayedGames } from '../api';
import { asset } from '../asset';
import { useAuth } from '../contexts/AuthContext';
import { LEVELS_PER_SESSION, TOTAL_SESSIONS, completedSessions, countedLevels } from '../progress';

const FILL_DURATION_MS = 3000; // 燃料從目前高度慢慢升到新高度的時間，與 CSS 的 transition 一致
const ENTRANCE_MS = 3500; // 等 .fade-in-and-grow 的進場動畫 (延遲 1.5 秒 + 2 秒) 結束再開始填充

const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 數字跟著燃料一起往上數
const useCountUp = (target, duration) => {
    const [value, setValue] = useState(0);
    const valueRef = useRef(0);

    useEffect(() => {
        const from = valueRef.current;
        if (from === target || prefersReducedMotion()) {
            valueRef.current = target;
            setValue(target);
            return undefined;
        }
        const start = performance.now();
        let frame;
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out，和填充動畫的節奏接近
            valueRef.current = Math.round(from + (target - from) * eased);
            setValue(valueRef.current);
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
};

const ProgressBar = ({ username }) => {
    const [playedCount, setPlayedCount] = useState(null); // null = 還沒讀到，燃料先保持空的
    const [isRising, setIsRising] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const { progressVersion } = useAuth(); // 每玩完一個遊戲會加一，觸發重新讀取

    useEffect(() => {
        const timer = setTimeout(() => setHasEntered(true), prefersReducedMotion() ? 0 : ENTRANCE_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;
        getPlayedGames(username)
            .then((data) => { if (isMounted) setPlayedCount(countedLevels(data.playedGames)); })
            .catch((error) => console.error('Error fetching played games:', error));
        return () => { isMounted = false; };
    }, [username, progressVersion]);

    const played = hasEntered ? (playedCount || 0) : 0;
    const sessions = Math.min(completedSessions(played), TOTAL_SESSIONS);
    // 填充高度用連續值，玩到一半的冒險也看得到一點進展
    const fillPercent = Math.min(played / (LEVELS_PER_SESSION * TOTAL_SESSIONS), 1) * 100;
    const shownSessions = useCountUp(sessions, FILL_DURATION_MS);

    // 燃料上升時讓燃料槽發光一下
    const lastFill = useRef(0);
    useEffect(() => {
        if (fillPercent <= lastFill.current) return undefined;
        lastFill.current = fillPercent;
        setIsRising(true);
        const timer = setTimeout(() => setIsRising(false), FILL_DURATION_MS);
        return () => clearTimeout(timer);
    }, [fillPercent]);

    return (
        <div className="progress-widget fade-in-and-grow">
            <img src={asset('/image/progress.svg')} alt="" className="progress-icon" />
            <div className="progress-body">
                <div
                    className={`progress-bar ${isRising ? 'is-rising' : ''}`}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={TOTAL_SESSIONS}
                    aria-valuenow={sessions}
                    aria-label="收集進度"
                >
                    <div className={`progress-fill ${fillPercent > 0 ? 'has-fuel' : ''}`} style={{ height: `${fillPercent}%` }}>
                        <span className="progress-bubble" />
                        <span className="progress-bubble" />
                        <span className="progress-bubble" />
                    </div>
                    <span className="progress-count">{shownSessions}<small>/{TOTAL_SESSIONS}</small></span>
                </div>
                <span className="progress-label">收集進度</span>
            </div>
        </div>
    );
};

export default ProgressBar;
