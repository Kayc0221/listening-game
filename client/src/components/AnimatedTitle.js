//AnimatedTitle.jsx

import React, { useEffect, useState } from 'react';

const AnimatedTitle = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!text) return;

        let i = 0;
        let localDisplayedText = ''; // 本地變數
        setDisplayedText('');

        const timer = setInterval(() => {
            if (i < text.length) {
                localDisplayedText += text[i];  // 更新本地變數
                setDisplayedText(localDisplayedText);  // 更新狀態
                i++;
            } else {
                clearInterval(timer);
            }
        }, 120);

        return () => clearInterval(timer);
    }, []);


    return (
        <h1 style={{
            fontSize: '2.5vw', // 字體大小
            color: 'white', // 字體顏色
            textShadow: '2px 2px 4px black' // 黑色描邊
        }}>
            {displayedText}
        </h1>
    );

};

export default AnimatedTitle;
