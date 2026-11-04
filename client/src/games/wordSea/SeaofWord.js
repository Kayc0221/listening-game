// SeaofWord.jsx
import React, { useState, useEffect } from 'react';
import './SeaofWord.css'; // 引入外部 CSS
import AnimatedTitle from '../../components/AnimatedTitle';
import AudioAmplitude from '../../components/AudioAmplitude';
import { useAudio, preloadAudio } from '../../contexts/AudioContext';
import ScoreStarsField from '../../components/ScoreStarsField';
import { getAverageScore, submitScore } from '../../api';
import { asset } from '../../asset';


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

    const [Difficulty, setDifficulty] = useState(0); // 0 = 這一關的難度還沒算出來
    const [averageScore, setAverageScore] = useState(null);
    const [difficultyFor, setDifficultyFor] = useState(null); // 難度是用哪一關的題目算的
    const [ans, setAns] = useState('');
    const [target, setTarget] = useState('');
    const [showTarget, setShowTarget] = useState(true);
    const [hasCheckedChoices, setHasCheckedChoices] = useState(false);

    


    // 平均分數 (0-10，可能有小數) → 難度 1-3 (要記的目標字數)
    const convertScoreToDifficulty = (score) => {
        if (score <= 3) return 1;
        if (score <= 6) return 2;
        return 3;
    };

    const playAudioAt = (file, delay, onEnded) => {
        setTimeout(() => {
            const audioIndex = addAudio(file, false, false, null, onEnded);
            setNewIndex1(audioIndex);
            playAudio(audioIndex);
        }, delay);
    };

    // 依難度先每 1.3 秒播一個目標字，再播整句 (再聽一次時整句提早播)
    const playAudioByDifficulty = (difficulty, onSentenceEnded) => {
        for (let i = 1; i <= difficulty; i++) {
            playAudioAt(`game4/${choicedGamedata[2]}-${i}.wav`, 1300 * (i - 1));
        }
        playAudioAt(`game4/${choicedGamedata[2]}.wav`, hasCheckedChoices ? 4500 : 6500, onSentenceEnded);
    };

    // 這一關的難度、目標字都算好了才能播放 (否則難度還是 0，按下去要等 6.5 秒整句才出聲)
    const isReady = difficultyFor === choicedGamedata && Difficulty > 0;

    const handleButtonClick = () => {
        if (buttonClicked || !isReady) {  // 如果按钮已点击且还未确认答案，直接返回
            return;
        }
        setShowTarget(true);
        pauseAudio(0);

        // 如果已经确认答案，可以再次播放
        if (hasCheckedChoices) {
            playAudioByDifficulty(Difficulty);
            return;
        }

        // 整句播完才顯示選項並恢復背景音樂 (句子長 12-25 秒，固定等 25 秒會太早或太晚)
        let revealed = false;
        const revealChoices = () => {
            if (revealed) return;
            revealed = true;
            setShowState(4);
            playAudio(0);
            setStartChoicesAnimation(true);
        };
        playAudioByDifficulty(Difficulty, () => setTimeout(revealChoices, 800));
        setTimeout(revealChoices, 35000); // 保險：音訊被中斷沒有觸發 ended 時

        setTimeout(() => setShowState(3), 2500);
        setButtonClicked(true);
    };



    // 平均分數：一開始和每次作答後更新 (後端一次請求約 2-3 秒)
    useEffect(() => {
        let isMounted = true;
        getAverageScore(username).then((score) => { if (isMounted) setAverageScore(score); });
        return () => { isMounted = false; };
    }, [hasCheckedChoices, username]);

    // 每一關只在拿到這一關的題目時算一次難度，作答後平均分數更新也不會改到正在顯示的答案
    useEffect(() => {
        if (averageScore === null || difficultyFor === choicedGamedata || !Array.isArray(choicedGamedata[1])) {
            return;
        }
        const newDifficulty = convertScoreToDifficulty(averageScore);
        setAns(choicedGamedata[1][1].substring(0, newDifficulty));
        setTarget(choicedGamedata[1][0].substring(0, newDifficulty));
        setDifficulty(newDifficulty);
        setDifficultyFor(choicedGamedata);
    }, [averageScore, choicedGamedata, difficultyFor]);

    // 先把這一關會播的音檔下載好，按下播放時才不會等網路
    useEffect(() => {
        if (!isReady) return;
        for (let i = 1; i <= Difficulty; i++) {
            preloadAudio(`game4/${choicedGamedata[2]}-${i}.wav`);
        }
        preloadAudio(`game4/${choicedGamedata[2]}.wav`);
    }, [isReady, Difficulty, choicedGamedata]);



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
            if (hasCheckedChoices) return; // 答案已經顯示，不能再改選
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

            // 如果選擇的數量達到Difficulty，且尚未進行過結算，則進行結算
            if (newSelected.size === Difficulty && !hasCheckedChoices) {
                setButtonClicked(false);
                checkChoices(newSelected);
            }
        };



        const checkChoices = (newSelected) => {

            // 建立新的 Set，不直接修改 state 裡的 Set
            const correct = new Set();
            const incorrect = new Set();
            const missed = new Set();
            newSelected.forEach((choice) => {
                if (ans.includes(choice)) {
                    correct.add(choice);
                } else {
                    incorrect.add(choice);
                }
            });
            for (const char of ans) {
                if (!newSelected.has(char) && !incorrect.has(char)) {
                    missed.add(char);
                }
            }

            setCorrectChoices(correct);
            setIncorrectChoices(incorrect);
            setMissedChoices(missed);

            const score = correct.size/Difficulty*10;

            // 作答完立刻顯示對錯與正確答案 (之前答錯會先要求再聽一次，不顯示答案)
            submitScore(username, choicedGamedata[2], score);
            setHasCheckedChoices(true);  // 標記已經進行過結算
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
        setHasCheckedChoices(false);
        setAns('');
        setTarget('');
        setShowTarget(false);

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
                            <div className={`playButton ${!buttonClicked && isReady ? 'showClickme' : ''} ${!isReady ? 'is-waiting' : ''}`} onClick={handleButtonClick}></div>
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
                                {correctChoices.has(word) && <span className="tick" style={{ color: 'green' }}>✓</span>}
                                {incorrectChoices.has(word) && <span className="cross" style={{ color: 'red' }}>✗</span>}
                                {missedChoices.has(word) && <span className="missed" style={{ color: '#cf0808' }}>O</span>}
                            </div>
                        </button>
                    ))}
                </div>

                {isGameEnded &&
                    <div className="game-end-section4 fade-in-and-grow">
                        <div className="game-end-message">
                            <div onClick={startNewRound}>
                                <p>正確答案: 「{addCommasToChinese(ans)}」你答對了嗎?</p>
                                <img src={asset('/image/icon/next.png')} alt="Next" className="next-icon" />
                            </div>
                        </div>   
                    </div>
                }



            </div>
            </>
    );



};

export default SeaofWord;
