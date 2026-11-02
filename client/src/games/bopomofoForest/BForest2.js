// BForest2.jsx
import React, { useState, useEffect } from 'react';
import './BForest2.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';

import { getAverageScore, submitScore } from '../../api';
import { translateZhuyinToCode } from './zhuyin';
import { asset } from '../../asset';



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

    const [Difficulty, setDifficulty] = useState(0); // 假设默认值为 1
    
    const [btnnameA,setBtnnameA] =useState('A2')
    const [btnnameB,setBtnnameB] =useState('B2')
    const [btnnameC,setBtnnameC] =useState('C2')





    const convertScoreToDifficulty = (score) => {
        if (score >= 1 && score <= 2.5) {
            return 0; 
        } else if (score > 2.5 && score <= 5) {
            return 1; 
        } else if(score > 5 && score <= 7.5){
            return 2; 
        }else {
            return 3; 
        }
    };


    const handleButtonClick = async (buttonType) => {
        if (currentStep === 'speed_played'||currentStep === 'question') {  // 如果按钮已点击且还未确认答案，直接返回
            return;
        }

        await pauseAudio(0);

        let Audio1_Idx;

        if (buttonType==='A') {
            Audio1_Idx = await addAudio(`game3/${translateZhuyinToCode(choicedGamedata[1][Difficulty])}.mp3`, false);
        }

        setNewIndex1(Audio1_Idx);
        await playAudio(Audio1_Idx);


        setTimeout(() => playAudio(0), 5000); // 5 秒後恢復背景音樂

        // 如果已经确认答案，可以再次播放
        if (hasCheckedChoices) {
            return;
        }

        // 播放完毕，展示问题
        setButtonClicked(true);

        if (buttonType==='A') {
            setTimeout(() => setShowState(3), 3000);
            setCurrentStep('speed_played');
        }else{
            setCurrentStep('speed_played2');
        }
    };

    const handleButtonClick_2 = async (buttonType) => {
        if (currentStep === 'checkAns'|| currentStep === 'playback') {
            return;
        }
        setSelectedOption(buttonType);
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


    useEffect(() => {
        const fetchAndSetDifficulty = async () => {
            // 获取平均分数
            const averageScore = await getAverageScore(username);
            const Difficulty = convertScoreToDifficulty(averageScore);
            setDifficulty(Difficulty);
        };

        fetchAndSetDifficulty();
    }, [hasCheckedChoices,choicedGamedata, username]); // 依赖项数组包含 hasCheckedChoices 和 username

    useEffect(() => {
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
    }, [Difficulty, choicedGamedata]);
    
    
    
    

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
                        <div className={`playButton ${!buttonClicked ? 'showClickme' : ''}`} onClick={() => handleButtonClick('A')}></div>
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
