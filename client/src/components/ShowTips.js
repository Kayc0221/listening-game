import React, { useEffect, useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext'; // 引入 useAuth
import './ShowTips.css';  // 引入CSS文件
const apiBaseUrl = process.env.REACT_APP_API_URL;

const ShowTips = ({ classValue, onClick }) => {
    const [tip, setTip] = useState('');
    const [index, setIndex] = useState(null);
    const { addAudio, playAudio } = useAudio();
    const { shownTips, setShownTips } = useAuth(); // 使用 useAuth 來訪問和更新 shownTips

    useEffect(() => {
        let isMounted = true;

        const fetchRandomTip = async () => {
            let url = `${apiBaseUrl}/api/getTips?class=${classValue}`;
            try {
                let response, data;
                let attempts = 0; // 用於控制嘗試次數
                const maxAttempts = 10; // 最多嘗試10次以避免無限循環

                do {
                    response = await fetch(url);
                    if (response.ok) {
                        data = await response.json();
                        attempts++;
                    } else {
                        console.log("Failed to fetch tips:", response.status);
                        return; // 如果獲取失敗，直接返回
                    }
                } while (shownTips.includes(data.index) && attempts < maxAttempts); // 確保新提示未被顯示過

                if (isMounted && data && !shownTips.includes(data.index)) {
                    setTip(data.tip);
                    setIndex(data.index);
                    console.log(data.tip);
                    console.log(data.index);
                    if (data.index !== null) {
                        const tipsAudio = await addAudio(`tips/${data.index}.wav`, false);
                        await playAudio(tipsAudio);
                        setShownTips((prevShownTips) => [...prevShownTips, data.index]); // 播放完成後更新 shownTips
                    }
                }
            } catch (error) {
                console.log("An error occurred:", error);
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
                    🎓溝通小訣竅:<br />
                    {tip}<br />
                    點擊後繼續...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShowTips;
