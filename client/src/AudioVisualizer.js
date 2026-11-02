import React, { useRef, useEffect, useState } from 'react';
import { useAudio } from './AudioContext';

const AudioVisualizer = ({ audioIndex }) => {
    const canvasRef = useRef(null);
    const { analyser, getCurrentAudioTime, getAudioDuration } = useAudio();
    const rafIdRef = useRef(null);

    // State to manage canvas dimensions
    const [dimensions, setDimensions] = useState({ width: window.innerWidth*0.35, height: 100 });

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Set new width to window's innerWidth or to a maximum width you define and fixed height
            setDimensions({ width: window.innerWidth*0.35, height: 100 });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (!analyser) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = dimensions.width;  // Update canvas width dynamically
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const duration = getAudioDuration(audioIndex);
            const currentTime = getCurrentAudioTime(audioIndex);
            const progress = (currentTime / duration) * width;

            analyser.getByteTimeDomainData(dataArray);

            // Clear canvas with semi-transparent background
            ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // Draw waveform
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#007bff';  // Blue waveform
            ctx.beginPath();

            const sliceWidth = width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // Draw progress bar
            ctx.strokeStyle = 'red';  // Red progress bar
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(progress, 0);
            ctx.lineTo(progress, height);
            ctx.stroke();

            rafIdRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(rafIdRef.current);
        };
    }, [audioIndex, analyser, getCurrentAudioTime, getAudioDuration, dimensions]);  // Include dimensions in dependency array

    return <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} style={{ border: '1px solid #ddd', maxWidth: '100%' }} />;
};

export default AudioVisualizer;
