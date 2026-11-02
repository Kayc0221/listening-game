import React, { useEffect } from 'react';
import './ShootingStars.css';

const createStar = (container) => {
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.left = `${Math.random() * 100}vw`;
    star.style.top = `${Math.random() * 100}vh`;
    star.style.animationDuration = `${Math.random() * 2 + 1}s`;
    star.style.animationDelay = `${Math.random() * 10}s`;
    container.appendChild(star);
};

const ShootingStars = () => {
    useEffect(() => {
        const container = document.getElementById("star-container");

        // 初始化10顆星
        for (let i = 0; i < 10; i++) {
            createStar(container);
        }

        // 每5秒添加5顆星，直到達到30顆
        const addInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                createStar(container);
            }
            if (container.childElementCount >= 30) {
                clearInterval(addInterval);
            }
        }, 5000);

        // 每10秒移除5顆星，直到剩下10顆
        const removeInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                if (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
            if (container.childElementCount <= 10) {
                clearInterval(removeInterval);
            }
        }, 10000);

        return () => {
            clearInterval(addInterval);
            clearInterval(removeInterval);
        };
    }, []);

    return <div id="star-container" className="star-container"></div>;
};

export default ShootingStars;
