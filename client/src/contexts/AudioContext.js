// AudioContext.js
import React, { createContext, useContext, useState, useRef } from 'react';
import { asset } from '../asset';

const AudioContext = createContext();

// 預先下載音檔到瀏覽器快取；之後 addAudio 同一個檔案時可以馬上播放
const preloaded = new Set();
export const preloadAudio = (src) => {
    const url = asset(`/audio/${src}`);
    if (preloaded.has(url)) return;
    preloaded.add(url);
    fetch(url).catch(() => preloaded.delete(url));
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};

export const AudioProvider = ({ children }) => {
    const audioSources = useRef([]);
    const [volume, setVolume] = useState(0.5);
    const audioContext = useRef(null);
    const analyser = useRef(null);
    // 只建立一次 AudioContext (useRef 的初始值每次 render 都會被重新計算)
    if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.connect(audioContext.current.destination);
    }

    const wakeAudioContext = async () => {
        if (audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
        }
    };

    // 加入音訊並返回其在陣列中的索引；onEnded 會在自然播完時呼叫 (被其他音訊中斷時不會)
    const addAudio = (src, shouldLoop= false, isBackground = false, mixedAudioBuffer = null, onEnded = null) => {
        let newAudio;
        let source;

        if (mixedAudioBuffer) {
            // 使用 AudioBuffer
            newAudio = audioContext.current.createBufferSource();
            newAudio.buffer = mixedAudioBuffer;
            newAudio.loop = shouldLoop;

            // 經過 gainNode 再接到 analyser，音量才會受音量控制影響
            const gainNode = audioContext.current.createGain();
            gainNode.gain.value = volume;
            newAudio.connect(gainNode);

            newAudio.gainNode = gainNode;
            source = gainNode;
        } else {
            // 使用 URL
            const fullPath = asset(`/audio/${src}`);
            newAudio = new Audio(fullPath);
            newAudio.loop = shouldLoop;
            newAudio.volume = volume; // 使用相同的音量
            source = audioContext.current.createMediaElementSource(newAudio);
        }

        source.connect(analyser.current);

        // 播完後移除「這個」音訊 (之前用陣列最後一個索引，播完時可能已經不是它)
        const index = audioSources.current.length;
        if (!shouldLoop || mixedAudioBuffer) {
            newAudio.addEventListener('ended', () => {
                removeAudio(index);
                if (onEnded) onEnded();
            });
        }

        newAudio.isBackground = isBackground;
        audioSources.current.push(newAudio);
        return audioSources.current.length - 1; // 返回新音訊的索引
    };

    const removeAudio = index => {
        const targetAudio = audioSources.current[index];
        if (targetAudio && !targetAudio.isBackground) {
            if (targetAudio instanceof AudioBufferSourceNode) {
                targetAudio.stop();
            } else if (targetAudio instanceof Audio) {
                targetAudio.pause();
                targetAudio.src = ""; // 清空音頻源，這一步可能是可選的
            }
            audioSources.current[index] = null;
        }
    };

    const playAudio = async (index, playbackRate = 1) => {
        const targetAudio = audioSources.current[index];
        wakeAudioContext();

        audioSources.current.forEach((audio, idx) => {
            if (idx < index && audio && !audio.isBackground) {  // 排除當前要播放的音檔和背景音樂
                if (audio instanceof AudioBufferSourceNode) {
                    if (audio.__started) {
                        audio.stop();
                        if (idx !== 1) {
                            audio.disconnect();
                        }
                    }
                } else if (audio instanceof Audio) {
                    audio.pause();
                }
                audioSources.current[idx] = null;
            }
        });

        if (targetAudio) {
            if (!targetAudio.__started) {  // 檢查是否已經開始播放
                if (targetAudio instanceof AudioBufferSourceNode) {
                    targetAudio.playbackRate.value = playbackRate;
                    targetAudio.start();
                    targetAudio.__started = true;  // 標記為已開始
                } else if (targetAudio instanceof Audio) {
                    targetAudio.playbackRate = playbackRate;
                    targetAudio.play();
                }
            }
        }
    };

    const pauseAudio = index => {
        const targetAudio = audioSources.current[index];
        if (targetAudio) {
            if (targetAudio instanceof AudioBufferSourceNode) {
                targetAudio.stop();
                targetAudio.__started = false;
            } else if (targetAudio instanceof Audio) {
                targetAudio.pause();
            }
        }
    };

    const isAudioPlaying = index => {
        const targetAudio = audioSources.current[index];
        if (targetAudio) {
            if (targetAudio instanceof AudioBufferSourceNode) {
                return targetAudio.__started ? true : false;
            } else if (targetAudio instanceof Audio) {
                return !targetAudio.paused;
            }
        }
        return false;
    };

    const setAudioVolume = newVolume => {
        setVolume(newVolume);
        audioSources.current.forEach(audio => {
            if (audio) {
                if (audio instanceof AudioBufferSourceNode && audio.gainNode) {
                    audio.gainNode.gain.value = newVolume;
                } else if (audio instanceof Audio) {
                    audio.volume = newVolume;
                }
            }
        });
    };

    const getCurrentAudioTime = index => {
        const targetAudio = audioSources.current[index];
        if (targetAudio) {
            if (targetAudio instanceof AudioBufferSourceNode) {
                // 手動計算 AudioBufferSourceNode 的當前播放時間
            } else if (targetAudio instanceof Audio) {
                return targetAudio.currentTime;
            }
        }
        return 0;
    };

    const getAudioDuration = index => {
        const targetAudio = audioSources.current[index];
        if (targetAudio) {
            if (targetAudio instanceof AudioBufferSourceNode) {
                return targetAudio.buffer.duration;
            } else if (targetAudio instanceof Audio) {
                return targetAudio.duration;
            }
        }
        return 0;
    };

    return (
        <AudioContext.Provider value={{
            addAudio,
            playAudio,
            pauseAudio,
            isAudioPlaying,
            setAudioVolume,
            removeAudio,
            volume,
            analyser: analyser.current,
            getCurrentAudioTime,
            getAudioDuration
        }}>
            {children}
        </AudioContext.Provider>
    );
};
