// GameComponent.jsx
import React, { useState, useEffect } from 'react';
import ChoiceGrid from './noiseCanyon/ChoiceGrid';
import { useAuth } from '../contexts/AuthContext';
import './GameComponent.css';
import ShowTips from '../components/ShowTips';
import SpeedRun from './speedArena/SpeedRun';
import SeaofWord from './wordSea/SeaofWord';
import BForest from './bopomofoForest/BForest';
import BForest2 from './bopomofoForest/BForest2';
const apiBaseUrl = process.env.REACT_APP_API_URL;

const Game1Component = ({ selectedGames, username, gameName, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [gameDatas, setGameDatas] = useState([]);  // 從MongoDB獲取的選項
    const { background, setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);
    

    useEffect(() => {
        let isMounted = true; // 用來追蹤組件是否還在掛載
        const fetchGameDatas = async () => {
            const url = `${apiBaseUrl}/api/getGameDatas?gameId=${selectedGames[currentLevel]}`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw data from server:', data);
                    if (isMounted) {
                        setGameDatas(data); // 在這裡更新狀態
                    }
                } else {
                    console.log("Failed to fetch game data:", response.status);
                }
            } catch (error) {
                console.log("An error occurred:", error);
            }
        };

        fetchGameDatas();

        return () => {
            isMounted = false; // 組件卸載時，設置為 false
        };
    }, [currentLevel, username, selectedGames]);  // 添加其他可能的依賴


    const startGame = () => {
        setIsGameStarted(true);
    };

    const nextLevel = () => {
        if (currentLevel < selectedGames.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setIsLevelCompleted(false);
        }
        else {
            setShowExpandedTips(true);
            setBackground(`/image/tips-background.jpg`);
        }
    };

    const returnToGameSelector = () => {
        onGameEnd();
    }
    useEffect(() => {
        if (isLevelCompleted) {
            nextLevel();
        }
    }, [isLevelCompleted]);

    return (
        <>
            <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        <>
                            <ChoiceGrid
                                choicedGamedata={gameDatas || []}
                                username={username}
                                setIsLevelCompleted={setIsLevelCompleted}
                            />
                        </>
                    ) : (
                        <>
                            <h1 className="level-name">{gameName}</h1>
                            <div className="description-container">
                                <p className="description-text">
                                    「 歡迎來到噪音峽谷，在這個地方你要在充滿環境噪音的狀況下，辨認出正確的句子，完成後便能獲得燃料元素喔。」
                                </p>
                                <button className="start-game-button" onClick={startGame}>
                                    <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {showExpandedTips && (
                <>
                    <img
                        src={`/image/tips-background.jpg`}
                        alt={`Tips Icon`}
                        className="game-icon-expanded"
                    />
     
                    <ShowTips classValue={`1`} onClick={returnToGameSelector} />
                </>
            )}
        </>
    );


};

const Game2Component = ({ selectedGames, username, gameName, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [gameDatas, setGameDatas] = useState([]);  // 從MongoDB獲取的選項
    const { background, setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);

    useEffect(() => {
        let isMounted = true; // 用來追蹤組件是否還在掛載

        const fetchGameDatas = async () => {
            const url = `${apiBaseUrl}/api/getGameDatas?gameId=${selectedGames[currentLevel]}`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw data from server:', data);
                    if (isMounted) {
                        setGameDatas(data); // 在這裡更新狀態
                    }
                } else {
                    console.log("Failed to fetch game data:", response.status);
                }
            } catch (error) {
                console.log("An error occurred:", error);
            }
        };

        fetchGameDatas();

        return () => {
            isMounted = false; // 組件卸載時，設置為 false
        };
    }, [currentLevel, username, selectedGames]);  // 添加其他可能的依賴


    const startGame = () => {
        setIsGameStarted(true);
    };

    const completeLevel = () => {
        // TODO: 判斷條件（例如，所有問題的答案都正確）
        setIsLevelCompleted(true);
    };

    const nextLevel = () => {
        if (currentLevel < selectedGames.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setIsLevelCompleted(false);
        }
        else {
            setShowExpandedTips(true);
            setBackground(`/image/tips-background.jpg`);
        }
    };

    const returnToGameSelector = () => {
        onGameEnd();
    }
    useEffect(() => {
        if (isLevelCompleted) {
            nextLevel();
        }
    }, [isLevelCompleted]);

    function MockChoiceGrid({ setShowExpandedTips }) {
        useEffect(() => {
            // 模擬組件的行為，這裡我設置了2秒的延遲，你可以調整
            setTimeout(() => {
                setShowExpandedTips(true);
                setIsLevelCompleted(true);
            }, 2000);
        }, []);

        return <div>Mocked ChoiceGrid</div>;
    }



    return (
        <>
            <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        <>
                            <SpeedRun
                                choicedGamedata={gameDatas || []}
                                username={username}
                                setIsLevelCompleted={setIsLevelCompleted}
                            />
                        </>
                    ) : (
                        <>
                            <h1 className="level-name">{gameName}</h1>
                            <div className="description-container">
                                <p className="description-text">
                                        「 歡迎來到音速競技場，在這裡你會聽到不同語速的句子，請仔細聽題目，並選出答案。 」
                                </p>
                                <button className="start-game-button" onClick={startGame}>
                                    <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {showExpandedTips && (
                <>
                    <img
                        src={`/image/tips-background.jpg`}
                        alt={`Tips Icon`}
                        className="game-icon-expanded"
                    />

                    <ShowTips classValue={`1`} onClick={returnToGameSelector} />
                </>
            )}
        </>
    );


};

const Game3Component = ({ selectedGames, username, gameName, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [gameDatas, setGameDatas] = useState([]);  // 從MongoDB獲取的選項
    const { background, setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);

    useEffect(() => {
        let isMounted = true; // 用來追蹤組件是否還在掛載

        const fetchGameDatas = async () => {
            const url = `${apiBaseUrl}/api/getGameDatas?gameId=${selectedGames[currentLevel]}`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw data from server:', data);
                    if (isMounted) {
                        setGameDatas(data); // 在這裡更新狀態
                    }
                } else {
                    console.log("Failed to fetch game data:", response.status);
                }
            } catch (error) {
                console.log("An error occurred:", error);
            }
        };

        fetchGameDatas();

        return () => {
            isMounted = false; // 組件卸載時，設置為 false
        };
    }, [currentLevel, username, selectedGames]);  // 添加其他可能的依賴


    const startGame = () => {
        setIsGameStarted(true);
    };

    const completeLevel = () => {
        // TODO: 判斷條件（例如，所有問題的答案都正確）
        setIsLevelCompleted(true);
    };

    const nextLevel = () => {
        if (currentLevel < selectedGames.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setIsLevelCompleted(false);
        }
        else {
            setShowExpandedTips(true);
            setBackground(`/image/tips-background.jpg`);
        }
    };

    const returnToGameSelector = () => {
        onGameEnd();
    }
    useEffect(() => {
        if (isLevelCompleted) {
            nextLevel();
        }
    }, [isLevelCompleted]);

    return (
        <>
            <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        <>
                            {currentLevel >= 5 ? (
                                <BForest2
                                    choicedGamedata={gameDatas || []}
                                    username={username}
                                    setIsLevelCompleted={setIsLevelCompleted}
                                />
                            ) : (
                                <BForest
                                    choicedGamedata={gameDatas || []}
                                    username={username}
                                    setIsLevelCompleted={setIsLevelCompleted}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="level-name">{gameName}</h1>
                            <div className="description-container">
                                <p className="description-text">
                                        「 歡迎進入ㄅㄅ森林，在這裡你會聽到許多讀音，有些發音你可能沒有聽過，這並不影響作答。 」
                                </p>
                                <button className="start-game-button" onClick={startGame}>
                                    <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {showExpandedTips && (
                <>
                    <img
                        src={`/image/tips-background.jpg`}
                        alt={`Tips Icon`}
                        className="game-icon-expanded"
                    />

                    <ShowTips classValue={`1`} onClick={returnToGameSelector} />
                </>
            )}
        </>
    );


};

const Game4Component = ({ selectedGames, username, gameName, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [gameDatas, setGameDatas] = useState([]);  // 從MongoDB獲取的選項
    const { background, setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);

    useEffect(() => {
        let isMounted = true; // 用來追蹤組件是否還在掛載

        const fetchGameDatas = async () => {
            const url = `${apiBaseUrl}/api/getGameDatas?gameId=${selectedGames[currentLevel]}`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw data from server:', data);
                    if (isMounted) {
                        setGameDatas(data); // 在這裡更新狀態
                    }
                } else {
                    console.log("Failed to fetch game data:", response.status);
                }
            } catch (error) {
                console.log("An error occurred:", error);
            }
        };

        fetchGameDatas();

        return () => {
            isMounted = false; // 組件卸載時，設置為 false
        };
    }, [currentLevel, username, selectedGames]);  // 添加其他可能的依賴


    const startGame = () => {
        setIsGameStarted(true);
    };

    const completeLevel = () => {
        // TODO: 判斷條件（例如，所有問題的答案都正確）
        setIsLevelCompleted(true);
    };

    const nextLevel = () => {
        if (currentLevel < selectedGames.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setIsLevelCompleted(false);
        }
        else {
            setShowExpandedTips(true);
            setBackground(`/image/tips-background.jpg`);
        }
    };

    const returnToGameSelector = () => {
        onGameEnd();
    }
    useEffect(() => {
        if (isLevelCompleted) {
            nextLevel();
        }
    }, [isLevelCompleted]);

    function MockChoiceGrid({ setShowExpandedTips }) {
        useEffect(() => {
            setTimeout(() => {
                setShowExpandedTips(true);
                setIsLevelCompleted(true);
            }, 2000);
        }, []);

        return <div>Mocked ChoiceGrid</div>;
    }

    return (
        <>
            <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        <>
                            <SeaofWord
                                choicedGamedata={gameDatas || []}
                                username={username}
                                setIsLevelCompleted={setIsLevelCompleted}
                            />
                        </>
                    ) : (
                        <>
                            <h1 className="level-name">{gameName}</h1>
                            <div className="description-container">
                                <p className="description-text">
                                        「 這裡是文字海，本遊戲會需要用到一點記憶力，題目會要求你記住一個關鍵字，作答時你需要回答關鍵字前面出現的字 」
                                </p>
                                <button className="start-game-button" onClick={startGame}>
                                    <img src="/image/icon/next.png" alt="Next" className="next-icon" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {showExpandedTips && (
                <>
                    <img
                        src={`/image/tips-background.jpg`}
                        alt={`Tips Icon`}
                        className="game-icon-expanded"
                    />

                    <ShowTips classValue={`1`} onClick={returnToGameSelector} />
                </>
            )}
        </>
    );


};

const GameComponent = ({ selectedGames, username, gameName, onGameEnd }) => {
    switch (gameName) {
        case "噪音峽谷":
            return <Game1Component selectedGames={selectedGames} username={username} gameName={gameName} onGameEnd={onGameEnd} />;
        case "音速競技場":
            return <Game2Component selectedGames={selectedGames} username={username} gameName={gameName} onGameEnd={onGameEnd} />;
        case "ㄅㄅ森林":
            return <Game3Component selectedGames={selectedGames} username={username} gameName={gameName} onGameEnd={onGameEnd} />;
        case "文字海":
            return <Game4Component selectedGames={selectedGames} username={username} gameName={gameName} onGameEnd={onGameEnd} />;
        default:
            return <div>未知的遊戲</div>;
    }
};


export default GameComponent;