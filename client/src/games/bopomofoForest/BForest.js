// BForest.jsx
import React, { useState, useEffect } from 'react';
import './BForest.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';

import { submitScore } from '../../api';
import { translateZhuyinToCode } from './zhuyin';


const BForest = ({ choicedGamedata, username, setIsLevelCompleted }) => {

    const { pauseAudio, addAudio, playAudio } = useAudio();
    const [buttonClicked, setButtonClicked] = useState(false);
    const [showState, setShowState] = useState(0);
    const [newIndex1, setNewIndex1] = useState(null);  // 新增這行
    const [isGameEnded, setIsGameEnded] = useState(false);


    const [currentStep, setCurrentStep] = useState('playback'); // 'playback', 'question', 'answer'

    const [correctAnswer1 , setCorrectAnswer1] = useState('A');
    const [correctAnswer2 , setCorrectAnswer2] = useState('A');
    const [callCount, setCallCount] = useState(0);
    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);
    const [aPlayed, setAPlayed] = useState(false);
    const [bPlayed, setBPlayed] = useState(false);
    const [aPlayed2, setAPlayed2] = useState(false);
    const [bPlayed2, setBPlayed2] = useState(false);
    const [cPlayed2, setCPlayed2] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedOption2, setSelectedOption2] = useState(null);
    const [answerResult, setAnswerResult] = useState(null); // 'correct' 或 'incorrect'
    const [answerResult2, setAnswerResult2] = useState(null); // 'correct' 或 'incorrect'

    const [btnnameA1,setBtnnameA1] =useState('A1')
    const [btnnameB1,setBtnnameB1] =useState('B1')
    const [btnnameA2,setBtnnameA2] =useState('A2')
    const [btnnameB2,setBtnnameB2] =useState('B2')
    const [btnnameC2,setBtnnameC2] =useState('C2')
    const [totalscore,setTotalscore] =useState(0)
    const [isRound2,setIsRound2] = useState(false)
    const [anschecked,setAnsChecked] = useState(false)
    const [anschecked2,setAnsChecked2] = useState(false)
    








    const handleButtonClick = async (buttonType) => {
        if (currentStep === 'speed_played'||currentStep === 'question') {  // 如果按钮已点击且还未确认答案，直接返回
            return;
        }

        await pauseAudio(0);

        let Audio1_Idx;

        if (buttonType==='A') {
            Audio1_Idx = await addAudio(`game3/${translateZhuyinToCode(choicedGamedata[1][0])}.mp3`, false);
        }else{
            Audio1_Idx = await addAudio(`game3/${translateZhuyinToCode(choicedGamedata[1][1])}.mp3`, false);
        }

        setNewIndex1(Audio1_Idx);
        await playAudio(Audio1_Idx);


        setTimeout(() => playAudio(0), 5000); // 5 秒後恢復背景音樂

        // 如果已经确认答案，可以再次播放
        if (hasCheckedChoices) {
            return;
        }

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
        if (!anschecked) {
            setSelectedOption(buttonType);
            checkChoices(buttonType);
            setCurrentStep('quest1finished');
            setAnsChecked(true);
            return;
        }
        return;

    };

    const handleButtonClick_3 = async (buttonType) => {
        if (currentStep === 'checkAns2'|| currentStep === 'playback') {
            return;
        }
        if (!anschecked2) {
            setSelectedOption2(buttonType);
            checkChoices(buttonType);
            setCurrentStep('checkAns2');
            setAnsChecked2(true);
            return;
        }

        return;
        
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
        if (aPlayed2 && bPlayed2 && cPlayed2) {
            setCurrentStep('question2');
            setTimeout(() => {
                setAPlayed2(false);
                setBPlayed2(false);
                setCPlayed2(false);
            }, 5000);
        }
    }, [aPlayed2, bPlayed2,cPlayed2]);

    useEffect(() => {
        // 初始化遊戲
        const initGame = () => {
            // 對第一組問題的選項進行隨機排序
            const order1 = Math.random() < 0.5 ? ['0', '1'] : ['1', '0'];
            setBtnnameA1(choicedGamedata[0][0][order1[0]]);
            setBtnnameB1(choicedGamedata[0][0][order1[1]]);
    
            // 對第二組問題的選項進行隨機排序
            const order2 = ['0', '1', '2'];
            order2.sort(() => Math.random() - 0.5);
            setBtnnameA2(choicedGamedata[0][1][order2[0]]);
            setBtnnameB2(choicedGamedata[0][1][order2[1]]);
            setBtnnameC2(choicedGamedata[0][1][order2[2]]);
    
            // 假設第一組問題的正確答案總是choicedGamedata[0][0][0]，設置正確答案的位置
            const correctAnswer1 = order1.indexOf('0') === 0 ? 'A' : 'B';
    
            // 對於第二組問題，找出choicedGamedata[0][1][0]（正確答案）在隨機排序中的位置，並轉換為按鈕標籤
            const correctAnswer2Index = order2.indexOf('0'); // 找出正確答案的索引
            const correctAnswer2 = ['A', 'B', 'C'][correctAnswer2Index]; // 將索引轉換為對應的按鈕標籤
    
            // 設置正確答案的按鈕（您可能需要根據實際情況存儲或使用這個值）
            setCorrectAnswer1(correctAnswer1); // 假定您有一個狀態來存儲這個信息
            setCorrectAnswer2(correctAnswer2); // 假定您有一個狀態來存儲這個信息
        };
    
        initGame();
    
    }, [choicedGamedata]);
    

    const checkChoices = (choice) => {
        if (!isRound2) {
            const score = choice === correctAnswer1 ? 5 : 0;
            setTotalscore(score);
            // 根据得分设置答案结果状态
            if (score === 5) {
                setAnswerResult('correct');
            } else {
                setAnswerResult('incorrect');
            }
            setTimeout(() => {setShowState(4);}, 3000);
            setIsRound2(true);
            setHasCheckedChoices(true);
            setButtonClicked(false);
        }else{
            const score = choice === correctAnswer2 ? 5 : 0;
            // 根据得分设置答案结果状态
            if (score === 5) {
                setAnswerResult2('correct');
            } else {
                setAnswerResult2('incorrect');
            }
            submitScore(username, choicedGamedata[2], score+ totalscore);
            setHasCheckedChoices(true);
            setIsGameEnded(true);
            setButtonClicked(false);
        }
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
         setAnswerResult2('Null')
         setIsRound2(false);
         setAnsChecked(false);
         setAnsChecked2(false);
    };

    useEffect(() => {
        // 这个 effect 会在 callCount 更新后触发
        if (callCount === 5) { // 注意这里的条件需要考虑实际的需求，可能需要调整
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
                    <ScoreStarsField state={Math.floor(callCount/1.25)} numStars={4} className="score-stars-field" />
                )}

                {showState >= 1 && ( 
                        <div className="title-container-1">
                            <AnimatedTitle text="聽清楚這個音，等等在答案裡找出他：" />
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
                    {(currentStep !== 'playback') && (
                        <>
                        <AudioVisualizer audioIndex={newIndex1} />
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_2('A')}>{btnnameA1}</button>
                                {selectedOption === 'A' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'A' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_2('B')}>{btnnameB1}</button>
                                {selectedOption === 'B' && answerResult === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption === 'B' && answerResult === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                        </>
                    )}
                </div>
             )}
            {showState >= 3 && (
                <div className="grid-container3">
                    {(isRound2) && (
                        <>
                         <AnimatedTitle text="還有一題!加油!：" />
                            <div className={`playButton3 ${!buttonClicked ? 'showClickme' : ''}`} onClick={() => handleButtonClick('B')}></div>
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_3('A')}>{btnnameA2}</button>
                                {selectedOption2 === 'A' && answerResult2 === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption2 === 'A' && answerResult2 === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_3('B')}>{btnnameB2}</button>
                                {selectedOption2 === 'B' && answerResult2 === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption2 === 'B' && answerResult2 === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                            <div className="grid-item-content2">
                                <button onClick={() => handleButtonClick_3('C')}>{btnnameC2}</button>
                                {selectedOption2 === 'C' && answerResult2 === 'correct' && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {selectedOption2 === 'C' && answerResult2 === 'incorrect' && <span className="cross" style={{ color: 'red' }}>✗</span>}
                            </div>
                        </>
                    )}
                </div>
             )}

            {isGameEnded &&
                <div className="game-end-section fade-in-and-grow">
                    <div
                        className="game-end-message"
                        onClick={startNewRound}  // 為整個 div 添加 onClick 事件
                    >
                            {"正確的答案是 :「 "}{choicedGamedata[1][0]}{" 」"}{"以及:「 "}{choicedGamedata[1][1]}{" 」"}<br />{"你答對了嗎?"}
                            <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                        </div>   
                </div>
            }

            </div>
        </>
    );



};

export default BForest;
