// StarField.js
import React from 'react';
import ScoreStars from './ScoreStars';
import './ScoreStarsField.css';

const STAR_SPACING_VMIN = 11;

// state 可以是小數：例如 1.5 = 第一顆全亮、第二顆亮一半
function StarField({ state, numStars }) {
    const stars = Array.from({ length: numStars }, (_, i) => Math.min(Math.max(state - i, 0), 1));

    // 星星 10vmin 寬、間距 11vmin，排成一道弧線 (中間最高)；全用 vmin，任何螢幕比例都不會重疊
    const arcTop = (index) => (numStars > 1 ? -3 * Math.sin((Math.PI * index) / (numStars - 1)) : 0);

    return (
        <div className="star-field" style={{ width: `${(numStars - 1) * STAR_SPACING_VMIN + 10}vmin` }}>
            {stars.map((fill, index) => (
                <div key={index} className="star-item" style={{ left: `${index * STAR_SPACING_VMIN}vmin`, top: `${arcTop(index)}vmin` }}>
                    <ScoreStars fill={fill} />
                </div>
            ))}
        </div>
    );
}

export default StarField;

