// SpeedRun.jsx
import React, { useState, useEffect } from 'react';
import './SpeedRun.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';
const apiBaseUrl = process.env.REACT_APP_API_URL;



const SpeedRun = ({ choicedGamedata, username, setIsLevelCompleted }) => {

    const { pauseAudio, addAudio, playAudio } = useAudio();
    const [buttonClicked, setButtonClicked] = useState(false);
    const [showState, setShowState] = useState(0);
    const [newIndex1, setNewIndex1] = useState(null);  // 新增這行
    const [isGameEnded, setIsGameEnded] = useState(false);


    const [currentStep, setCurrentStep] = useState('playback'); // 'playback', 'question', 'answer'
    const [playbackRate, setPlaybackRate] = useState(1); // 播放速度

    const [correctAnswer , setCorrectAnswer] = useState('A');
    const [callCount, setCallCount] = useState(0);
    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);
    const [randomOrder, setRandomOrder] = useState('AB');  // 新增狀態保存隨機順序
    const [aPlayed, setAPlayed] = useState(false);
    const [bPlayed, setBPlayed] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);
    const [answerResult, setAnswerResult] = useState(null); // 'correct' 或 'incorrect'




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

    const convertScoreToPlaybackRate = (score) => {
        // 分数范围：0 - 10
        // 播放速度范围：0.5 - 1.5
        // 分数 0 对应播放速度 0.5，分数 10 对应播放速度 1.5
        const playbackRate = 0.8 + (score / 10) * 1.7;
        return playbackRate;
    };


    const handleButtonClick = async () => {
        if (currentStep === 'speed_played'||currentStep === 'question') {  // 如果按钮已点击且还未确认答案，直接返回
            return;
        }

        await pauseAudio(0);
        console.log("Start playbackRate:", playbackRate);
        
        const Audio1_Idx = await addAudio(`game2/${choicedGamedata[2]}-1.wav`, false);
        await playAudio(Audio1_Idx,playbackRate);


        await setTimeout(() => {
             playAudio(0);
        }, 5000);

        // 如果已经确认答案，可以再次播放
        if (hasCheckedChoices) {
            return;
        }

        // 播放完毕，展示问题
        setCurrentStep('speed_played');
        setButtonClicked(true);

        const timer3 = setTimeout(() => setShowState(3), 3000);
        const timer4 = setTimeout(() => {
            setShowState(4);
        }, 5000);

        return () => {
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    };


    const handleButtonClick_2 = async (buttonType) => {
        if (currentStep === 'question') {
            // 显示选中标记并传递选项
            setSelectedOption(buttonType);
            checkChoices(buttonType);
            setCurrentStep('checkAns');
            return;
        }
        if (currentStep === 'checkAns') {
            return;
        }


        pauseAudio(0);
        console.log("Start playbackRate:", playbackRate);
        
        const Audio2_Idx = await addAudio(`game2/${choicedGamedata[2]}-1.wav`, false);
        const Audio3_Idx = await addAudio(`game2/${choicedGamedata[2]}-2.wav`, false);

        if ((randomOrder === 'AB' && buttonType === 'A') || (randomOrder === 'BA' && buttonType === 'B')) {
            if (aPlayed) return;
            await playAudio(Audio2_Idx, 1);
            setAPlayed(true);
            setNewIndex1(Audio2_Idx);
        } else {
            if (bPlayed) return;
            await playAudio(Audio3_Idx, 1);
            setBPlayed(true);
            setNewIndex1(Audio3_Idx);
        }
    };

    useEffect(() => {
        if (aPlayed && bPlayed) {
            setCurrentStep('question');
            setTimeout(() => {
                setAPlayed(false);
                setBPlayed(false);
            }, 5000);
        }
    }, [aPlayed, bPlayed]);

    useEffect(() => {
        // 初始化遊戲
        const initGame = () => {
            const newOrder = Math.random() < 0.5 ? 'AB' : 'BA';
            setRandomOrder(newOrder);
            setCorrectAnswer(newOrder === 'AB' ? 'A' : 'B'); 
        };
    
        initGame();
    
    }, [callCount]);

    useEffect(() => {
        const fetchAndSetPlaybackRate = async () => {
            // 获取平均分数
            const averageScore = await fetchAverageScore(username);
    
            // 将分数转换为播放速度
            const newPlaybackRate = convertScoreToPlaybackRate(averageScore);
            setPlaybackRate(newPlaybackRate); // 假设您已经定义了 setPlaybackRate 更新播放速度的状态
        };
    
        fetchAndSetPlaybackRate();
    }, [hasCheckedChoices, username]);



    const checkChoices = (choice) => {
        const score = choice === correctAnswer ? 10 : 0;
        // 根据得分设置答案结果状态
        if (score === 10) {
            setAnswerResult('correct');
        } else {
            setAnswerResult('incorrect');
        }
        const userInfo = {
            score: `${choicedGamedata[2]} : ${score}`
        };
        writeToDatabase('maindata', userInfo, username);

        setHasCheckedChoices(true);
        setIsGameEnded(true);
        setButtonClicked(false);
    };

    const startNewRound = () => { 

         setCallCount(prevCount => prevCount + 1); 
         setButtonClicked(false);

        setHasCheckedChoices(false);

         setIsLevelCompleted(true);
         setCurrentStep('playback');
        // 重置遊戲結束標記
         setIsGameEnded(false);
         setAnswerResult('Null')

    };
    useEffect(() => {
        // 这个 effect 会在 callCount 更新后触发
        if (callCount === 4) { // 注意这里的条件需要考虑实际的需求，可能需要调整
            setShowState(0);
        }
    }, [callCount]); // 依赖列表中包含 callCount

    const getDifficultyLabel = (value) => {
        if (value >= 0 && value <= 1.3) return '容易';
        if (value > 1.3 && value < 1.9) return '普通';
        if (value >= 1.9 && value <= 2.5) return '困難';
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
            <div className="game2-container">
                {showState >= 0 && (
                    <ScoreStarsField state={callCount} numStars={4} className="score-stars-field" />
                )}

                {showState >= 1 && ( 
                        <div className="title-container-1">
                            <AnimatedTitle text="請仔細聽下面的句子：(按播放鍵開始)" />
                        </div>
                )}
            {showState >= 2 && (
                    <div className="audio-control">
                        <div className={`playButton ${!buttonClicked ? 'showClickme' : ''}`} onClick={handleButtonClick}></div>
                        <AudioAmplitude />
                    </div>
            )}
                {showState >= 3 && (
                    <div className="title-container-2">
                        <div style={{ display: 'inline-block' }}>
                            <AnimatedTitle text={`請在下面選出，相同內容的句子：`} />
                        </div>
                    </div>
                )}
            {showState >= 3 && (
                <div className="grid-container2 fade-in-and-grow">
                    {(currentStep === 'speed_played' || currentStep === 'question' || currentStep === 'checkAns') && (
                        <>
                            {currentStep === 'question' && <div className="prompt-top-right fade-in-and-grow">請選擇</div>}
                            <AudioVisualizer audioIndex={newIndex1} />
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_2('A')}>{'A'}</button>
                                {selectedOption === 'A' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'A' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_2('B')}>{'B'}</button>
                                {selectedOption === 'B' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'B' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                        </>
                    )}
                </div>
            )}




            {isGameEnded &&
                <div className="game-end-section2 fade-in-and-grow">
                    <div
                        className="game-end-message2"
                        onClick={startNewRound}  // 為整個 div 添加 onClick 事件
                    >
                            {"正確的答案是 :「 "}{choicedGamedata[1]}{" 」"}<br />{"你答對了嗎?調整難度再聽一次吧! "}
                            <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                        </div>   

                        <div className="snr-controls">
                            <div className="snr-label-container">
                                <span className="snr-difficulty-label">{` 難度(${getDifficultyLabel(playbackRate)})`}</span>
                            </div>
                            <div className="snr-slider-container">
                                <input
                                    type="range"
                                    id="snr-slider"
                                    min="0.8"
                                    max="2.5"
                                    step="0.1" // 滑动条移动的最小间隔
                                    value={playbackRate}
                                    onChange={(e) => setPlaybackRate(e.target.value)}
                                />
                            </div>
                        </div>
                </div>
            }

            </div>
        </>
    );



};

export default SpeedRun;
