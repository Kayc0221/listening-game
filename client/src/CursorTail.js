import React, { useRef, useEffect } from 'react';
import './CursorTail.css'; // 引入您的CSS樣式

const CursorTail = () => {
    const tails = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const tailElements = tails.current.children;


            // 獲取視窗的95%的寬度和高度
            const maxMouseX = window.innerWidth * 0.98;
            const maxMouseY = window.innerHeight * 0.98;

            // 限制滑鼠的位置不超出上述的界限
            let mouseX = Math.min(e.clientX, maxMouseX);
            let mouseY = Math.min(e.clientY, maxMouseY);

            Array.from(tailElements).forEach((tail, index) => {
                setTimeout(() => {
                    tail.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(calc(2.1 - 0.2 * ${index}))`;

                }, index * 30);  // 50是延遲時間，可以根據需要調整
            });
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            // 清理事件監聽器
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div id="cursorTailContainer" ref={tails}>
            {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="tail"></div>
            ))}
        </div>
    );
}

export default CursorTail;
