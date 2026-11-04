// BForest2.jsx
import React, { useState, useEffect, useRef } from 'react';
import './BForest2.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';

import { getAverageScore, submitScore } from '../../api';
import { translateZhuyinToCode } from './zhuyin';
import { asset } from '../../asset';



// gameType 5 的題目：[0] 是 4 組 (難度 0-3) [答案, 干擾一, 干擾二]，[1] 是 4 個答案
const isGame5Data = (data) =>
    Array.isArray(data) && Array.isArray(data[0]) && data[0].length === 4 &&
    data[0].every((group) => Array.isArray(group) && group.length === 3) && Array.isArray(data[1]);

const BForest2 = ({ choicedGamedata, username, setIsLevelCompleted }) => {

    const { pauseAudio, addAudio, playAudio } = useAudio();
    const [buttonClicked, setButtonClicked] = useState(false);
    const [showState, setShowState] = useState(0);
    const [newIndex1, setNewIndex1] = useState(null);  // 新增這行
    const [isGameEnded, setIsGameEnded] = useState(false);


    const [currentStep, setCurrentStep] = useState('playback'); // 'playback', 'question', 'answer'

    const [correctAnswer , setCorrectAnswer] = useState('A');
    const [callCount, setCallCount] = useState(0);
    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);
    const [aPlayed, setAPlayed] = useState(false);
    const [bPlayed, setBPlayed] = useState(false);
    const [cPlayed, setCPlayed] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);
    const [answerResult, setAnswerResult] = useState(null); // 'correct' 或 'incorrect'

    const playedBeforeAnswer = useRef(false); // 用 ref：同一瞬間連點兩下也只播一次
    const [Difficulty, setDifficulty] = useState(0);
    const [averageScore, setAverageScore] = useState(null);
    const [difficultyFor, setDifficultyFor] = useState(null); // 難度是用哪一關的題目算的
    // 這一關的題目與難度都準備好了才能播放
    const isReady = difficultyFor === choicedGamedata && isGame5Data(choicedGamedata);

    const [btnnameA,setBtnnameA] =useState('A2')
    const [btnnameB,setBtnnameB] =useState('B2')
    const [btnnameC,setBtnnameC] =useState('C2')





    // 平均分數 (0-10) → 難度 0-3 (題目資料中第幾組選項)；之前分數 < 1 會落到最難的 3
    const convertScoreToDifficulty = (score) => {
        if (score <= 2.5) return 0;
        if (score <= 5) return 1;
        if (score <= 7.5) return 2;
        return 3;
    };


    // 作答前只能聽一次 (作答後可以再聽)；先改狀態再 await，連點兩下也只會播一次
    const handleButtonClick = async () => {
        if (!isReady || playedBeforeAnswer.current) {
            return;
        }
        if (!hasCheckedChoices) {
            playedBeforeAnswer.current = true;
            setButtonClicked(true);
            setTimeout(() => setShowState(3), 3000);
            setCurrentStep('speed_played');
        }

        await pauseAudio(0);
        const Audio1_Idx = await addAudio(`game3/${translateZhuyinToCode(choicedGamedata[1][Difficulty])}.mp3`, false);
        setNewIndex1(Audio1_Idx);
        await playAudio(Audio1_Idx);

        setTimeout(() => playAudio(0), 5000); // 5 秒後恢復背景音樂
    };

    const handleButtonClick_2 = async (buttonType) => {
        if (currentStep === 'checkAns'|| currentStep === 'playback') {
            return;
        }
        setSelectedOption(buttonType);
        playedBeforeAnswer.current = false; // 作答後可以再聽
        checkChoices(buttonType);
        setCurrentStep('checkAns');
        return;
    };


    useEffect(() => {
        if (aPlayed && bPlayed && cPlayed) {
            setCurrentStep('question');
            setTimeout(() => {
                setAPlayed(false);
                setBPlayed(false);
                setCPlayed(false);
            }, 5000);
        }
    }, [aPlayed, bPlayed,cPlayed]);


    // 平均分數：一開始和每次作答後更新
    useEffect(() => {
        let isMounted = true;
        getAverageScore(username).then((score) => { if (isMounted) setAverageScore(score); });
        return () => { isMounted = false; };
    }, [hasCheckedChoices, username]);

    // 每一關只在拿到這一關的題目時算一次難度：作答後才更新難度會重新洗牌按鈕，讓 ✓/✗ 標在錯的選項上
    useEffect(() => {
        if (averageScore === null || difficultyFor === choicedGamedata || !isGame5Data(choicedGamedata)) {
            return;
        }
        setDifficulty(convertScoreToDifficulty(averageScore));
        setDifficultyFor(choicedGamedata);
    }, [averageScore, choicedGamedata, difficultyFor]);

    useEffect(() => {
        // 題目格式不對 (例如還是 ㄅㄅ森林前段的資料) 時不初始化，之前會讀到不存在的選項組而整個畫面當掉
        if (!isReady) return;
        // 初始化遊戲
        const initGame = () => {
            // 生成一個隨機的ABC排序
            const positions = ['A', 'B', 'C'];
            const randomIndex = Math.floor(Math.random() * 3); // 隨機選擇正確答案的位置 (0, 1, 2)
    
            // 設置正確答案的按鈕位置
            const correctAnswerButton = positions[randomIndex];
            setCorrectAnswer(correctAnswerButton); // 保留正確答案的位置
    
            // 根據隨機位置設置按鈕名稱
            const btnNames = {};
            btnNames[correctAnswerButton] = choicedGamedata[0][Difficulty][0]; // 正確答案放在隨機位置
    
            // 設置混淆選項
            let wrongAnswerIdx = 1; // 混淆選項索引從 1 開始
            positions.forEach((pos, index) => {
                if (index !== randomIndex) {
                    btnNames[pos] = choicedGamedata[0][Difficulty][wrongAnswerIdx];
                    wrongAnswerIdx++;
                }
            });
    
            // 更新按鈕名稱
            setBtnnameA(btnNames['A']);
            setBtnnameB(btnNames['B']);
            setBtnnameC(btnNames['C']);
        };
    
        initGame();
    }, [isReady, Difficulty, choicedGamedata]);
    
    
    
    

    const checkChoices = (choice) => {
        const score = choice === correctAnswer ? 10 : 0;
        // 根据得分设置答案结果状态
        if (score === 10) {
            setAnswerResult('correct');
        } else {
            setAnswerResult('incorrect');
        }
        submitScore(username, choicedGamedata[2], score);
        setHasCheckedChoices(true);
        setIsGameEnded(true);
    };

    const startNewRound = () => { 

         setCallCount(prevCount => prevCount + 1); 
         setButtonClicked(false);

        setHasCheckedChoices(false);

         setIsLevelCompleted(true);
         setCurrentStep('playback');
         playedBeforeAnswer.current = false;
        // 重置遊戲結束標記
         setIsGameEnded(false);
         setAnswerResult('Null')

    };

    useEffect(() => {
        // 这个 effect 会在 callCount 更新后触发
        if (callCount === 8) { // 注意这里的条件需要考虑实际的需求，可能需要调整
            setShowState(0);
        }
    }, [callCount]); // 依赖列表中包含 callCount

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
                    <ScoreStarsField state={Math.floor(callCount/2)} numStars={4} className="score-stars-field" />
                )}

                {showState >= 1 && ( 
                        <div className="title-container-1">
                            <AnimatedTitle text="表現得很好接下來會更難一點呦：" />
                        </div>
                )}
            {showState >= 2 && (
                    <div className="audio-control">
                        <div className={`playButton ${!buttonClicked && isReady ? 'showClickme' : ''} ${!isReady ? 'is-waiting' : ''}`} onClick={handleButtonClick}></div>
                        <AudioAmplitude />
                    </div>
            )}
                {showState >= 3 && (
                    <div className="title-container-2">
                        <div style={{ display: 'inline-block' }}>
                            <AnimatedTitle text={`請在下面選出，相同內容的讀音：`} />
                        </div>
                    </div>
                )}
            {showState >= 3 && (
                <div className="grid-container2 fade-in-and-grow">
                    {(currentStep === 'speed_played' || currentStep === 'question' || currentStep === 'checkAns') && (
                        <>
                        <AudioVisualizer audioIndex={newIndex1} />
                            <div className="grid-item-content5">
                                <button onClick={() => handleButtonClick_2('A')}>{btnnameA}</button>
                                {selectedOption === 'A' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'A' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content5">
                                <button onClick={() => handleButtonClick_2('B')}>{btnnameB}</button>
                                {selectedOption === 'B' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'B' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content5">
                                <button onClick={() => handleButtonClick_2('C')}>{btnnameC}</button>
                                {selectedOption === 'C' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'C' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
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
                            {"正確的答案是 :「 "}{choicedGamedata[0][Difficulty][0]}{" 」"}<br />{"你答對了嗎?"}
                            <img src={asset('/image/icon/next.png')} alt="Next" className="next-icon" />
                        </div>   
                </div>
            }

            </div>
        </>
    );



};

export default BForest2;
