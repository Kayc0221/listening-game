import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from './AudioContext';

const AudioAmplitude = ({ index }) => {
    const canvasRef = useRef(null);
    const { analyser } = useAudio();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth * 0.5, height: window.innerHeight * 0.15 }); // 假设宽度为视窗宽度的70%

    useEffect(() => {
        const handleResize = () => {
            // 当窗口大小改变时，更新尺寸状态
            setDimensions({
                width: window.innerWidth * 0.5,
                height: window.innerHeight * 0.15
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!analyser) return;

        analyser.fftSize = 4096;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const sampleRate = 44100;
        const maxFreq = 1000; // 1kHz
        const minFreq = 85; // 85Hz

        const maxIndex = Math.floor(maxFreq / (sampleRate / analyser.fftSize));
        const minIndex = Math.floor(minFreq / (sampleRate / analyser.fftSize));

        const canvas = canvasRef.current;
        canvas.width = dimensions.width; // 动态设置画布宽度
        canvas.height = dimensions.height; // 动态设置画布高度

        const ctx = canvas.getContext('2d');
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        const totalBars = maxIndex - minIndex;
        const barWidth = WIDTH / totalBars;

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            for (let i = minIndex; i < maxIndex; i++) {
                const barHeight = dataArray[i];
                const scaledBarHeight = (barHeight * HEIGHT / 255); // 根据画布高度调整条形高度

                const r = scaledBarHeight + (25 * (i / bufferLength));
                const g = 250 * (i / bufferLength);
                const b = 50;

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect((i - minIndex) * barWidth, HEIGHT - scaledBarHeight, barWidth, scaledBarHeight);
            }

            requestAnimationFrame(draw);
        };

        draw();
    }, [analyser, index, dimensions]); // 确保dimensions改变时重新绘制

    return <canvas ref={canvasRef} />;
};

export default AudioAmplitude;
