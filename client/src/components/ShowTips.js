import React, { useEffect, useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext'; // 引入 useAuth
import './ShowTips.css';  // 引入CSS文件
import { getTip } from '../api';

// 試算表的 tips 還沒有內容 (或讀取失敗) 時顯示的訊息
const FALLBACK_MESSAGE = '完成了！小怪獸又收集到一些燃料囉！';

const ShowTips = ({ classValue, onClick }) => {
    const [tip, setTip] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const { addAudio, playAudio } = useAudio();
    const { shownTips, setShownTips } = useAuth(); // 使用 useAuth 來訪問和更新 shownTips

    useEffect(() => {
        let isMounted = true;

        const fetchRandomTip = async () => {
            try {
                // 盡量挑沒看過的小訣竅，但最多問 3 次 (每次 2-3 秒；之前最多 10 次，要等 20 幾秒)，還是重複就照樣顯示
                let data;
                let attempts = 0;
                do {
                    data = await getTip(classValue);
                    attempts++;
                } while (shownTips.includes(data.index) && attempts < 3);

                if (isMounted && data) {
                    setTip(data.tip);
                    if (data.index !== null) {
                        const tipsAudio = await addAudio(`tips/${data.index}.wav`, false);
                        await playAudio(tipsAudio);
                        setShownTips((prevShownTips) => (prevShownTips.includes(data.index) ? prevShownTips : [...prevShownTips, data.index]));
                    }
                }
            } catch (error) {
                console.error("An error occurred:", error);
            } finally {
                if (isMounted) setIsLoaded(true);
            }
        };

        fetchRandomTip();

        return () => {
            isMounted = false;
        };
    }, [classValue]); // 添加 shownTips 和 setShownTips 作為依賴項

    return (
        <div className={`tip-container ${classValue}`} onClick={onClick}>
            <div className="fade-in-and-grow">
                <div className="show-tips-container ">
                    <p>
                    {tip ? <>🎓溝通小訣竅:<br />{tip}</> : (isLoaded ? FALLBACK_MESSAGE : '…')}<br />
                    點擊後繼續...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShowTips;
