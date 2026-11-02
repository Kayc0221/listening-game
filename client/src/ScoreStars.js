import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';

function ShinyStar({ active }) {
    const [size, setSize] = useState(Math.min(window.innerWidth, window.innerHeight) * 0.1); // 假设我们基于视窗大小的20%来设置大小
    const [haloSize, setHaloSize] = useState(0);

    useEffect(() => {
        // 更新光环大小
        const updateHaloSize = active ? size * 0.45 : 0;
        setHaloSize(updateHaloSize);

        // 处理视窗尺寸变化
        const handleResize = () => {
            const newSize = Math.min(window.innerWidth, window.innerHeight) * 0.1;
            setSize(newSize);
            setHaloSize(active ? newSize * 0.45 : 0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [active, size]);

    const baseProps = useSpring({
        opacity: active ? 1 : 0.1,
        config: { duration: 1000 },
    });

    const haloProps = useSpring({
        r: haloSize,
        config: { duration: 1000 },
        reset: !active
    });

    const points = [
        50, 0,
        61.8, 35,
        98.1, 35,
        68.4, 57.3,
        79.3, 91.5,
        50, 70,
        20.7, 91.5,
        31.6, 57.3,
        1.9, 35,
        38.2, 35,
    ].map(p => p * size / 100).join(','); // 动态调整星星大小

    return (
        <svg width={`${size}px`} height={`${size}px`}>
            {/* 光環效果 */}
            <defs>
                <filter id="haloFilter">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feFlood floodColor="#ffd700" result="color" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feComposite in2="SourceAlpha" operator="in" />
                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode />
                    </feMerge>
                </filter>
            </defs>

            {/* 光環 */}
            {active && (
                <animated.circle
                    cx={`${size / 2}px`}
                    cy={`${size / 2}px`}
                    style={haloProps}
                    fill="none"
                    stroke="gold"
                    strokeWidth={`${size / 50}px`} // 基于大小的动态描边宽度
                    filter="url(#haloFilter)"
                />
            )}

            {/* 主星星 */}
            <animated.polygon
                points={points}
                fill={active ? "gold" : "grey"}
                stroke="black"
                strokeWidth={`${size / 50}px`} // 动态描边宽度
                style={baseProps}
            />
        </svg>
    );
}

export default ShinyStar;
