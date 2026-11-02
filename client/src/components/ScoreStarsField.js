// StarField.js
import React from 'react';
import ScoreStars from './ScoreStars';
import './ScoreStarsField.css';

function StarField({ state, numStars }) {
    // 使用 numStars 来决定星星的数量
    const stars = Array.from({ length: numStars }, (_, i) => i + 1).map(n => n <= state);

    return (
        <div className="star-field">
            {stars.map((active, index) => (
                <div key={index} className={`star-item star-${index}`}>
                    <ScoreStars active={active} />
                </div>
            ))}
        </div>
    );
}

export default StarField;

