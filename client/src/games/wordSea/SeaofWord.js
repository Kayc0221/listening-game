// SeaofWord.jsx
import React, { useState, useEffect } from 'react';
import './SeaofWord.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import { useAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';
import { getAverageScore, submitScore } from '../../api';


const SeaofWord = ({ choicedGamedata, username, setIsLevelCompleted }) => {
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

    const [Difficulty, setDifficulty] = useState(0); // 假设默认值为 1
    const [ans, setAns] = useState('');
    const [target, setTarget] = useState('');
    const [showTarget, setShowTarget] = useState(true);
    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);
    const [oneMoreRound, setOneMoreRound] = useState(false);

    


    const convertScoreToDifficulty = (score) => {
        if (score >= 1 && score <= 3) {
            return 1; // 分数 1-3 映射到难度 1
        } else if (score >= 4 && score <= 6) {
            return 2; // 分数 4-6 映射到难度 2
        } else {
            return 3; // 分数 7-10 映射到难度 3
        }
    };

// 一个函数，用于根据难度播放音频
const playAudioByDifficulty = async (difficulty) => {
    for (let i = 1; i <= difficulty; i++) {
        // 设置延迟播放
        await setTimeout(() => {
            const audioIndex = addAudio(`game4/${choicedGamedata[2]}-${i}.wav`, false);
            setNewIndex1(audioIndex);
             playAudio(audioIndex);
        }, 1300 * (i - 1)); // 每隔两秒播放下一个音频
    }
    if (hasCheckedChoices) {
        await setTimeout(() => {
            const audioIndex = addAudio(`game4/${choicedGamedata[2]}.wav`, false);
            setNewIndex1(audioIndex);
            playAudio(audioIndex);
        }, 4500); // 6.5秒播放下一个音频
    } else {
        await setTimeout(() => {
            const audioIndex = addAudio(`game4/${choicedGamedata[2]}.wav`, false);
            setNewIndex1(audioIndex);
            playAudio(audioIndex);
        }, 6500); // 6.5秒播放下一个音频
    }

};
    

    const handleButtonClick = async () => {
        if (buttonClicked) {  // 如果按钮已点击且还未确认答案，直接返回
            return;
        }
        setShowTarget(true);
        await pauseAudio(0);
        console.log("Start Difficulty:", Difficulty);

    
        // 调用函数以根据难度播放音频
        await playAudioByDifficulty(Difficulty);
    

        // 如果已经确认答案，可以再次播放
        if (hasCheckedChoices) {
            return;
        }

        await setTimeout(() => {
            //setShowTarget(false);
        }, 5000);


        const timer3 = setTimeout(() => {
            setShowState(3)
        }, 2500);
        const timer4 = setTimeout(() => {
            setShowState(4);
           playAudio(0);
            setStartChoicesAnimation(true); 
        }, 25000);
        setButtonClicked(true)

        return () => {
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    };



    useEffect(() => {
        const fetchAndSetDifficulty = async () => {
            // 获取平均分数
            const averageScore = await getAverageScore(username);
            const Difficulty = convertScoreToDifficulty(averageScore);
            const originalAns = choicedGamedata[1][1];
            const newAns = originalAns.substring(0, Difficulty);
            const originalTarget = choicedGamedata[1][0];
            const newTarget = originalTarget.substring(0, Difficulty);
            setAns(newAns);
            setTarget(newTarget);
            setDifficulty(Difficulty);
        };

        fetchAndSetDifficulty();
    }, [hasCheckedChoices,choicedGamedata, username]); // 依赖项数组包含 hasCheckedChoices 和 username



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


        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // 交换元素
            }
            return array;
        };
        
        useEffect(() => {
            if (startChoicesAnimation && choicedGamedata && Difficulty) {
                const numChars = Difficulty * 3; // 难度 1: 3个字符，难度 2: 6个字符，难度 3: 9个字符
                const splitWords = Array.from(choicedGamedata[0][0]).slice(0, numChars); // 根据难度截取字符串
                const shuffledWords = shuffleArray(splitWords); // 随机打乱数组
                setWordArray(shuffledWords);
            }
        }, [choicedGamedata, startChoicesAnimation, Difficulty]);
        

        const toggleChoice = (choice) => {
            const newSelected = new Set(selected);

            if (newSelected.has(choice)) {
                newSelected.delete(choice);
            } else {
                if (newSelected.size < Difficulty) {
                    newSelected.add(choice);
                }
            }

            // 更新選擇集合
            setSelected(newSelected);
            setSelectCount(newSelected.size);

            // 如果選擇的數量達到Difficulty，且尚未進行過結算，則進行結算
            if (newSelected.size === Difficulty && !hasCheckedChoices) {
                setButtonClicked(false);
                checkChoices(newSelected);
            }
        };

        const checkChoicesBtn = () => {
            if (!hasCheckedChoices) {
                setButtonClicked(false);
                checkChoices(selected);
            }
        }


        const checkChoices = (newSelected) => {

            // 使用 includes 方法來檢查 choice 是否出現在 choices[1] 中
            newSelected.forEach((choice) => {
                if (ans.includes(choice)) {
                    correctChoices.add(choice);
                } else {
                    incorrectChoices.add(choice);
                }
            });
            for (let i = 0; i < ans.length; i++) {
                const char = ans[i];
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

            const score = correctChoices.size/Difficulty*10;

            if (score !== 10 && !oneMoreRound) {
                setOneMoreRound(true);
                setSelected(new Set());
                setCorrectChoices(new Set());
                setIncorrectChoices(new Set());
                setMissedChoices(new Set());
                setShowTarget(true);
                submitScore(username, choicedGamedata[2], score);
            }else{
                setHasCheckedChoices(true);  // 標記已經進行過結算
                setOneMoreRound(false);
            }
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
        setAns('');
        setTarget('');
        setShowTarget(false);
        setOneMoreRound(false);

         setIsLevelCompleted(true);
        // 重置遊戲結束標記
         setIsGameEnded(false);
    };

    useEffect(() => {
        // 这个 effect 会在 callCount 更新后触发
        if (callCount === 2) { // 注意这里的条件需要考虑实际的需求，可能需要调整
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


    const addCommasToChinese = (str) => {
        return str.split('').join('，');
    };
    
    const textStyle = {
        display: 'inline-block',
        fontSize: '64px',
        color: 'red',
        textShadow: '2px 2px 4px black'
    };


    return (
        <>
            <div className="game1-container">
                {showState >= 0 && (
                    <ScoreStarsField state={callCount} numStars={2} className="score-stars-field" />
                )}

                {showState >= 1 && (
                    <div className="title-container-1">
                        <AnimatedTitle text="請仔細聽下面的目標字: " />
                        {showTarget && <div style={textStyle} >
                            {addCommasToChinese(target)}
                        </div>}
                    </div>
                )}
                {showState >= 2 && (
                        <div className="audio-control">
                            <div className={`playButton ${!buttonClicked ? 'showClickme' : ''}`} onClick={handleButtonClick}></div>
                            <AudioAmplitude audio={newIndex1} />
                        </div>
                )}
                {showState >= 3 && (
                    <div className="title-container-2">
                        <div style={{ display: 'inline-block' }}>
                            <AnimatedTitle text={`請仔細聽接下來的內容，並找出目標字「前一個字」為何？`} />
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
                                {!oneMoreRound && <>
                                    {correctChoices.has(word) && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                    {incorrectChoices.has(word) && <span className="cross" style={{ color: 'red' }}>✗</span>}
                                    {missedChoices.has(word) && <span className="missed" style={{ color: '#cf0808' }}>O</span>}
                                </>}
                            </div>
                        </button>
                    ))}
                </div>

                {isGameEnded &&
                    <div className="game-end-section4 fade-in-and-grow">
                        <div className="game-end-message">
                            {oneMoreRound ?
                                "答案不太正確喔，再聽一次，加油！" :
                                <div onClick={startNewRound}>
                                    <p>正確答案: 「{addCommasToChinese(ans)}」你答對了嗎?</p>
                                    <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                                </div>
                            }
                        </div>   
                    </div>
                }



            </div>
            </>
    );



};

export default SeaofWord;
