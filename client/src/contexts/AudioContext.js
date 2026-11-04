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

// 各遊戲音檔錄音音量不同：ㄅㄅ森林 (game3) 的 mp3 比其他遊戲的 wav 小約 7 dB (RMS 約 -23 dB vs -16 dB)，
// 播放時補上增益讓音量一致 (約 +7 dB；個別檔案音量差很多，後面再接限幅器)
const SOURCE_GAIN = { 'game3/': 2.2 };
const sourceGain = (src) => {
    const prefix = Object.keys(SOURCE_GAIN).find((p) => src.startsWith(p));
    return prefix ? SOURCE_GAIN[prefix] : 1;
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
            const gain = sourceGain(src);
            if (gain !== 1) {
                const gainNode = audioContext.current.createGain();
                gainNode.gain.value = gain;
                // 少數檔案本來就接近滿格 (峰值約 -2 dB)，放大後用限幅器壓住，避免破音
                const limiter = audioContext.current.createDynamicsCompressor();
                limiter.threshold.value = -3;
                limiter.knee.value = 0;
                limiter.ratio.value = 20;
                limiter.attack.value = 0.002;
                limiter.release.value = 0.1;
                source.connect(gainNode);
                gainNode.connect(limiter);
                source = limiter;
            }
        }

        source.connect(analyser.current);
        newAudio.outputNode = source; // 移除時要斷開，否則播過的音訊節點整個遊戲期間都接在音訊圖上

        // 播完後移除「這個」音訊 (之前用陣列最後一個索引，播完時可能已經不是它)
        const index = audioSources.current.length;
        if (!shouldLoop || mixedAudioBuffer) {
            newAudio.addEventListener('ended', () => {
                removeAudio(index);
                if (onEnded) onEnded();
            });
        }

        newAudio.isBackground = isBackground;
        // 背景音樂固定放在索引 0 (各遊戲用 pauseAudio(0) / playAudio(0) 控制它)。
        // 登出再登入時換掉舊的那首，否則新的會排到後面，遊戲暫停的是舊的，兩首會疊在一起播
        if (isBackground) {
            const old = audioSources.current[0];
            if (old instanceof Audio) {
                old.pause();
                old.src = '';
                if (old.outputNode) old.outputNode.disconnect();
            }
            audioSources.current[0] = newAudio;
            return 0;
        }
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
            if (targetAudio.outputNode) targetAudio.outputNode.disconnect();
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
                    if (audio.outputNode) audio.outputNode.disconnect();
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
