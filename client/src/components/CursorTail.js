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

            // 直接設定位置，延遲跟隨的效果交給每顆星星自己的 CSS transition
            // (之前每次滑鼠移動都排 10 個 setTimeout，滑鼠一動每秒就是幾百個)
            Array.from(tailElements).forEach((tail, index) => {
                tail.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(calc(2.1 - 0.2 * ${index}))`;
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
                <div key={index} className="tail" style={{ transition: `opacity 0.3s, transform ${index * 40}ms ease-out` }}></div>
            ))}
        </div>
    );
}

export default CursorTail;
