// JackpotBurst.js — 輪盤停下時的「拉霸機中獎」特效：跑馬燈燈泡、金色光澤掃過、金幣星星噴發、叮叮聲
// 放在圖片外層 (.game-icon-wrap) 裡，範圍和圖片一樣大
import React, { useEffect, useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './JackpotBurst.css';

const PARTICLES = ['🪙', '⭐', '✨', '🪙', '🌟', '🪙'];
const PARTICLE_COUNT = 24;
const BULBS_PER_LONG_SIDE = 11;
const BULBS_PER_SHORT_SIDE = 5;

// 用合成音做一段上行琶音 (不用另外放音檔)，接到 analyser 跟其他聲音走同一條路
const playChime = (analyser, volume) => {
    if (!analyser || !volume) return;
    const ctx = analyser.context;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093, 1568, 2093].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.09;
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3 * volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(analyser);
        osc.start(t);
        osc.stop(t + 0.55);
        osc.onended = () => gain.disconnect();
    });
};

// 燈泡沿著圖片外框順時針排一圈 (百分比座標)
const bulbPositions = () => {
    const spots = [];
    const side = (n, fn) => { for (let i = 0; i < n; i++) spots.push(fn(i / n)); };
    side(BULBS_PER_LONG_SIDE, (t) => [t * 100, 0]);
    side(BULBS_PER_SHORT_SIDE, (t) => [100, t * 100]);
    side(BULBS_PER_LONG_SIDE, (t) => [100 - t * 100, 100]);
    side(BULBS_PER_SHORT_SIDE, (t) => [0, 100 - t * 100]);
    return spots;
};
const BULBS = bulbPositions();

const JackpotBurst = () => {
    const { analyser, volume } = useAudio();
    // 每顆粒子的飛行方向、距離、延遲在出現時隨機決定一次
    const [particles] = useState(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.4;
        const distance = 18 + Math.random() * 16; // vmin
        return {
            icon: PARTICLES[i % PARTICLES.length],
            dx: `${Math.cos(angle) * distance}vmin`,
            dy: `${Math.sin(angle) * distance - 5}vmin`,
            rot: `${Math.round((Math.random() - 0.5) * 720)}deg`,
            delay: `${Math.round(Math.random() * 350)}ms`,
            size: `${2.6 + Math.random() * 2}vmin`,
        };
    }));

    useEffect(() => {
        playChime(analyser, volume);
        // 只在出現時響一次
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="jackpot" aria-hidden="true">
            <div className="jackpot-shine" />
            <div className="jackpot-lights">
                {BULBS.map(([x, y], i) => (
                    <span key={i} className={`jackpot-bulb ${i % 2 ? 'is-odd' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} />
                ))}
            </div>
            {particles.map((p, i) => (
                <span
                    key={i}
                    className="jackpot-particle"
                    style={{ '--dx': p.dx, '--dy': p.dy, '--rot': p.rot, '--delay': p.delay, fontSize: p.size }}
                >
                    {p.icon}
                </span>
            ))}
        </div>
    );
};

export default JackpotBurst;
