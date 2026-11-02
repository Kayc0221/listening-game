// ChoiceGrid.jsx
import React, { useState, useEffect } from 'react';
import './ChoiceGrid.css'; // 引入外部 CSS
import AnimatedTitle from './AnimatedTitle';
import AudioAmplitude from './AudioAmplitude';
import { useAudio } from './AudioContext';
import { createMixedAudio } from "./Audio_SNR";
import ScoreStarsField from './ScoreStarsField';

const apiBaseUrl = process.env.REACT_APP_API_URL;
let debounceTimer = null;


const ChoiceGrid = ({ choicedGamedata, username, setIsLevelCompleted }) => {
    const [selected, setSelected] = useState(new Set());  // 使用Set保存選中的選項
    const [wordArray, setWordArray] = useState([]); // 保存切分後的單字
    const { pauseAudio, addAudio, playAudio } = useAudio();
    const [buttonClicked, setButtonClicked] = useState(false);
    const [showWordIndex, setShowWordIndex] = useState(-1); // 新增狀態來追踪顯示到哪個單詞了
    const [newIndex1, setNewIndex1] = useState(null);  // 新增這行
    const [showState, setShowState] = useState(0);

    const [startChoicesAnimation, setStartChoicesAnimation] = useState(false);
    const [correctChoices, setCorrectChoices] = useState(new Set());
    const [incorrectChoices, setIncorrectChoices] = useState(new Set());
    const [missedChoices, setMissedChoices] = useState(new Set());

    const [isGameEnded, setIsGameEnded] = useState(false);

    const [callCount, setCallCount] = useState(0);
    const [selectCount, setSelectCount] = useState(0);

    const [snrRate, setSnrRate] = useState(0); // 假设默认值为 1

    
    const writeToDatabase = async (collection, userInfo, username) => {
        const url = `${apiBaseUrl}/${collection}/updateScore`;

        const payload = {
            username,  // 使用了傳入的 username
            scoreInfo: userInfo.score,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 200) {
                console.log('Score updated successfully');
            } else {
                console.log('Failed to update score');
            }
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const fetchAverageScore = async (username) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/getAvarageScore?username=${encodeURIComponent(username)}`);
            const averageScore = await response.json();
            return averageScore;
        } catch (error) {
            console.error('Error fetching average score:', error);
            return 5; // 发生错误时返回默认值 5
        }
    };

    // 将分数转换为 SNR 值的函数
    const convertScoreToSNR = (score) => {
        // 假设 10 分对应 -10，0 分对应 10
        const snr = -20 * (score / 10) + 10;
        //console.log("Start SNR:", snr);
        return snr;
    };


    const handleButtonClick = async () => {
        if (buttonClicked) {  
            return;
        }
        debounceTimer  = setTimeout(() => { debounceTimer = null; }, 1000);

        await pauseAudio(0);
        console.log("Start SNR:", snrRate);

        const mixedAudioBuffer = await createMixedAudio(`${choicedGamedata[2]}.wav`, "white_noise.WAV", snrRate);
        const mixedAudioIndex = await addAudio(null, false,false, mixedAudioBuffer);
        await playAudio(mixedAudioIndex);
        setNewIndex1(mixedAudioIndex);

        await setTimeout(() => {
            playAudio(0);
        }, 5000);

        if (hasCheckedChoices) {
            clearTimeout(debounceTimer);
            return;
        }

        const timer3 = setTimeout(() => setShowState(3), 3000);
        const timer4 = setTimeout(() => {
            setShowState(4);
            setStartChoicesAnimation(true); 
        }, 5000);
        setButtonClicked(true)

        return () => {
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(debounceTimer);
        };
    };

    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);

    useEffect(() => {
        const fetchAndSetSNR = async () => {
            // 获取平均分数
            const averageScore = await fetchAverageScore(username);

            // 将分数转换为 SNR 值
            const snrStartValue = convertScoreToSNR(averageScore);
            setSnrRate(snrStartValue);
        };

        fetchAndSetSNR();
    }, [hasCheckedChoices, username]); // 依赖项数组包含 hasCheckedChoices 和 username



        useEffect(() => {
            let timer;
            if (startChoicesAnimation && showWordIndex < wordArray.length - 1) {
                timer = setTimeout(() => {
                    setShowWordIndex(showWordIndex + 1);
                }, 300);  // 每300毫秒顯示一個單詞
            }

            return () => {
                clearTimeout(timer);  // 清除計時器
            };
        }, [showWordIndex, wordArray, startChoicesAnimation]);


        useEffect(() => {
            if (startChoicesAnimation && choicedGamedata) {
                const splitWords = Array.from(choicedGamedata[0]); // 將字符串轉換為單字陣列
                setWordArray(splitWords);
            }
        }, [choicedGamedata, startChoicesAnimation]);

        const toggleChoice = (choice) => {
            const newSelected = new Set(selected);

            if (newSelected.has(choice)) {
                newSelected.delete(choice);
            } else {
                if (newSelected.size < 10) {
                    newSelected.add(choice);
                }
            }

            // 更新選擇集合
            setSelected(newSelected);
            setSelectCount(newSelected.size);

            // 如果選擇的數量達到10，且尚未進行過結算，則進行結算
            if (newSelected.size === 10 && !hasCheckedChoices) {
                setHasCheckedChoices(true);  // 標記已經進行過結算
                setButtonClicked(false);
                checkChoices(newSelected);
            }
        };

        const checkChoicesBtn = () => {
            if (!hasCheckedChoices) {
                setHasCheckedChoices(true);
                setButtonClicked(false);
                checkChoices(selected);
            }
        }


        const checkChoices = (newSelected) => {

            // 使用 includes 方法來檢查 choice 是否出現在 choices[1] 中
            newSelected.forEach((choice) => {
                if (choicedGamedata[1].includes(choice)) {
                    correctChoices.add(choice);
                } else {
                    incorrectChoices.add(choice);
                }
            });
            for (let i = 0; i < choicedGamedata[1].length; i++) {
                const char = choicedGamedata[1][i];
                if (!newSelected.has(char) && !incorrectChoices.has(char)) {
                    missedChoices.add(char);
                }
            }

            setCorrectChoices(correctChoices);
            setIncorrectChoices(incorrectChoices);
            setMissedChoices(missedChoices);
            console.log(correctChoices);
            console.log(incorrectChoices);
            console.log(missedChoices);

            const score = correctChoices.size;
            const userInfo = {
                score: `${choicedGamedata[2]} : ${score}`
            };

            // 假設 userId 是用戶的唯一識別碼
            writeToDatabase('maindata', userInfo, username);

            setIsGameEnded(true);

    };

    const startNewRound = () => { 

         setCallCount(prevCount => prevCount + 1); 
         setSelected(new Set());
         setButtonClicked(false);
         setShowWordIndex(-1);
         setNewIndex1(null);  // 或設定為新的索引
         setStartChoicesAnimation(false);
         setCorrectChoices(new Set());
         setIncorrectChoices(new Set());
        setMissedChoices(new Set());
        setSelectCount(0);
        setHasCheckedChoices(false);

         setIsLevelCompleted(true);
        // 重置遊戲結束標記
         setIsGameEnded(false);

    };

    useEffect(() => {
        // 这个 effect 会在 callCount 更新后触发
        if (callCount === 3) { // 注意这里的条件需要考虑实际的需求，可能需要调整
            setShowState(0);
        }
    }, [callCount]); // 依赖列表中包含 callCount
    
    const getDifficultyLabel = (value) => {
        if (value >= -10 && value <= -4) return '困難';
        if (value > -4 && value < 4) return '普通';
        if (value >= 4 && value <= 10) return '容易';
    };



    useEffect(() => {
        const timer1 = setTimeout(() => setShowState(1), 1000);
        const timer2 = setTimeout(() => setShowState(2), 4000);

       return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        }; 
    }, []);

    return (
        <>
            <div className="game1-container">
                {showState >= 0 && (
                    <ScoreStarsField state={callCount} numStars={3} className="score-stars-field" />
                )}

                {showState >= 1 && ( 
                        <div className="title-container-1">
                            <AnimatedTitle text="請仔細聽下面的句子：(按播放鍵開始)" />
                        </div>
                )}
            {showState >= 2 && (
                    <div className="audio-control">
                        <div className={`playButton ${!buttonClicked ? 'showClickme' : ''}`} onClick={handleButtonClick}></div>
                        <AudioAmplitude audio={newIndex1} />
                        <button className="checkAnsButton" onClick={checkChoicesBtn}>確認選項</button>


                    </div>
            )}
                {showState >= 3 && (
                    <div className="title-container-2">
                        <div style={{ display: 'inline-block' }}>
                            <AnimatedTitle text={`在下面的文字中，點選出你有聽到的字：`} />
                        </div>
                        <div style={{ 
                            display: 'inline-block',
                            fontSize: '64px', 
                            color: 'white', 
                            textShadow: '2px 2px 4px black',
                            className: 'delayed-fade-in'
                            }}>
                            {selectCount}/10
                        </div>
                    </div>
                )}
            <div className="grid-container">
                {wordArray.slice(0, 20).map((word, index) => (
                    <button
                        key={index}
                        onClick={() => toggleChoice(word)}
                        className={`${selected.has(word) ? 'selected' : ''} grid-item ${index <= showWordIndex ? 'show' : ''}`}
                    >
                        <div className="grid-item-content">
                            {word}
                            {correctChoices.has(word) && <span className="tick" style={{ color: 'green' }}>✓</span>}
                            {incorrectChoices.has(word) && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            {missedChoices.has(word) && <span className="missed" style={{ color: '#cf0808' }}>O</span>}
                        </div>
                    </button>
                ))}
            </div>
            {isGameEnded &&
                <div className="game-end-section fade-in-and-grow">
                    <div
                        className="game-end-message"
                        onClick={startNewRound}  // 為整個 div 添加 onClick 事件
                    >
                            {"正確的答案是 :「 "}{choicedGamedata[1]}{" 」"}<br />{"你答對了嗎?調整難度再聽一次吧! "}
                            <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                        </div>   

                        <div className="snr-controls">
                            <div className="snr-label-container">
                                <span className="snr-difficulty-label">{` 難度(${getDifficultyLabel(parseInt(snrRate))})`}</span>
                            </div>
                            <div className="snr-slider-container">
                                <input
                                    type="range"
                                    id="snr-slider"
                                    min="-10"
                                    max="10"
                                    value={-snrRate}
                                    onChange={(e) => setSnrRate(-e.target.value)}
                                />
                            </div>
                        </div>
                </div>
            }

            </div>
        </>
    );



};

export default ChoiceGrid;
