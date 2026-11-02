import React, { useState, useEffect } from 'react';
import './GameSelector.css';
import { useAudio } from '../contexts/AudioContext';

import { useAuth } from '../contexts/AuthContext';
import GameComponent from './GameComponent';
import AnimatedTitle from '../components/AnimatedTitle';
import { ApiError, selectRandomGames } from '../api';


const GameSelector = ({ username }) => {
    const { setIsAuthenticated, setCurrentUser, setBackground } = useAuth();
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedGames, setSelectedGames] = useState([]); // 在這裡宣告

    const [isAnimating, setIsAnimating] = useState(false);
    const [finishAnimating, setfinishAnimating] = useState(false);
    const [canConfirm, setCanConfirm] = useState(false);
    const [showExpandedGame, setShowExpandedGame] = useState(false);
    const [showImage, setShowImage] = useState(true);  // 控制图片的显示
    const [gameRounds, setGameRounds] = useState(0);

    const [availableGames, setAvailableGames] = useState([1, 2, 3, 4]);
    const { pauseAudio, addAudio, playAudio,removeAudio } = useAudio();   


    const gameNames = {
        1: "噪音峽谷",
        2: "音速競技場",
        3: "ㄅㄅ森林",
        4: "文字海"
    };

    const startGameAnimation = () => {
        //pauseAudio(0);
        setIsAnimating(true);
        //setCanConfirm(false);
    };
    const exitGame = () => {
        // 在這裡加入退出遊戲和返回登入畫面的邏輯
        pauseAudio(0);
        removeAudio(0);
        setIsAuthenticated(false);
        setCurrentUser(null);
        console.log("遊戲結束，返回登入畫面");
        setBackground(`/image/main-menu.png`);
    };

    const fetchRandomGames = async () => {
        //pauseAudio(0);
        let data;
        try {
            data = await selectRandomGames(username, selectedGame);
        } catch (error) {
            console.log("Failed to fetch random games:", error);
            if (error instanceof ApiError) {
                window.alert("沒有更多遊戲可以玩了! 返回主選單!");
                exitGame();
            }
            return;
        }
        setSelectedGames(data.selectedGames);

        // ㄅㄅ森林 (3) 的後段關卡使用 gameType 5 的題目
        if (selectedGame === 3) {
            try {
                const additionalData = await selectRandomGames(username, 5);
                setSelectedGames([...data.selectedGames, ...additionalData.selectedGames]);
            } catch (error) {
                console.log("Failed to fetch games for gameType 5:", error);
            }
        }
    };
    


    const handleGameEnd = () => {
        setShowExpandedGame(false);
        //setShowImage(true); 
        if (gameRounds < 4) {
            setCanConfirm(false);
            setGameRounds(prevRounds => prevRounds + 1);
            setTimeout(() => setCanConfirm(true), 5000);
            setTimeout(startGameAnimation, 5000);
        }
    }



    useEffect(() => {
        if (gameRounds === 4) {
            setBackground(`/image/hint.jpg`);
        }
    }, [gameRounds]);  // 當 canConfirm 或 hasFetched 變化時觸發


    useEffect(() => {
        let gameIndex = 0;
        let speed = 100;
        let elapsedTime = 0;
        let totalTime = 1000 * availableGames.length + Math.random() * 2000; // 基本時間加上隨機值


        const runAnimation = () => {
            const currentGame = availableGames[gameIndex];
            //const currentGame = availableGames[1];
            setSelectedGame(currentGame);
            gameIndex = (gameIndex + 1) % availableGames.length; // 使其循環
            elapsedTime += speed;

            if (elapsedTime < totalTime) {
                speed += (15 + Math.random() * 10);  // 逐漸變慢
                setTimeout(runAnimation, speed);
            } else {
                setCanConfirm(true);
                setIsAnimating(false);
                setTimeout(() => {
                    setShowExpandedGame(true);
                }, 2000);
                setfinishAnimating(true);

                // 移除選擇的遊戲
                setAvailableGames(prevGames => prevGames.filter(game => game !== currentGame));
            }
        };

        if (isAnimating) {
            runAnimation();
        }
    }, [isAnimating]);


    useEffect(() => {
        if (finishAnimating) {
            fetchRandomGames(); 
            setfinishAnimating(false);
        }
    }, [finishAnimating]);  // 當 canConfirm 或 hasFetched 變化時觸發

    useEffect(() => {
        if (showExpandedGame) {
            const timer = setTimeout(() => {
                setBackground(`/image/game${selectedGame}.jpg`);
                //setShowImage(false);  // 隐藏图片
            }, 3000);  // 假设动画时长为 3 秒

            return () => clearTimeout(timer);  // 清除定时器
        }
    }, [showExpandedGame]);

    function getMessageByRound(gameRounds) {
        switch (gameRounds) {
            case 0:
                return "那我們今天就在 " + gameNames[selectedGame] + " 中開始我們的冒險吧";
            case 1:
                return "接下來就去 " + gameNames[selectedGame] + " 中尋找更多燃料吧！";
            case 2:
                return "雷達上發現 " + gameNames[selectedGame] + " 中有燃料的反應！";
            case 3:
                return "最後的挑戰是 " + gameNames[selectedGame] + " 努力堅持到最後吧！";
            case 4:
                return "Hello, " + username + " 讓我們開始旅程吧!!"
            case 5:
                return "恭喜你在 " + gameNames[selectedGame] + " 中找到了一些燃料！"
            case 6:
                return "看來努力是會有回報的 " + username + " 你表現得很好！"
            case 7:
                return "沒想到在 " + gameNames[selectedGame] + " 中還有這麼多燃料！"
            default:
                return "繼續您的冒險！";
        }
    }



    return (
        <div className="outer-container">
            {gameRounds < 4 && (
                <>
                    <div className="game-icons-container fade-in-and-grow">
                        <div className="game-row">
                            <img src="/image/game1.jpg" alt="Game Icon 1" className={`game-icon ${selectedGame === 1 ? 'highlight' : ''} ${!availableGames.includes(1) ? 'disabled' : ''}`} />
                            <img src="/image/game2.jpg" alt="Game Icon 2" className={`game-icon ${selectedGame === 2 ? 'highlight' : ''} ${!availableGames.includes(2) ? 'disabled' : ''}`} />
                        </div>
                        <div className="game-row">
                            <img src="/image/game3.jpg" alt="Game Icon 3" className={`game-icon ${selectedGame === 3 ? 'highlight' : ''} ${!availableGames.includes(3) ? 'disabled' : ''}`} />
                            <img src="/image/game4.jpg" alt="Game Icon 4" className={`game-icon ${selectedGame === 4 ? 'highlight' : ''} ${!availableGames.includes(4) ? 'disabled' : ''}`} />
                        </div>
                    </div>
                    <div className="controls">
                        {gameRounds === 0 && !canConfirm && (
                            <div className="button-container fade-in-and-grow">
                                <div className="game-button start-button" onClick={startGameAnimation}></div>
                                <div className="game-button exit-button" onClick={exitGame}></div>
                            </div>
                        )}
                        {!canConfirm ? (
                            <div className="text-container ">
                                <h1>{getMessageByRound(gameRounds+4)}</h1>
                            </div>
                        ) : (
                                <div className="text-container ">
                                    <h1>{getMessageByRound(gameRounds)}</h1>
                                </div>
                        )}
                    </div>
                </>
             )}
            
            {showExpandedGame && gameRounds <4 && (
                <>
                    {showImage && <img
                        src={`/image/game${selectedGame}.jpg`}
                        alt={`Game Icon ${selectedGame}`}
                        className="game-icon-expanded"
                    />}
                    <GameComponent
                        selectedGames={selectedGames}
                        username={username}
                        gameName={gameNames[selectedGame]}
                        onGameEnd={handleGameEnd} 
                    />
                </>
            )}
            {gameRounds === 4 && (
                <>
                    {showImage && (
                        <img
                            src={`/image/End-round.png`}
                            alt={`Game Icon ${selectedGame}`}
                            className="game-icon-expanded"
                        />
                    )}
                    <div className="endgame-text-container">
                        <AnimatedTitle text={`「小怪獸成功在今天的冒險中找到了一些燃料，但還不足以發射火箭，還請同學多多幫忙小怪獸尋找燃料，讓他可以早日回家😄」`} />
                    </div>
                    <div className="button-container fade-in-and-grow">
                        <div className="game-button exit-button" onClick={exitGame}></div>
                    </div>
                </>
            )}

            {gameRounds === 5 && (
                <>
                    {showImage && (
                        <img
                            src={`/image/endding.jpg`}
                            alt={`Game Icon ${selectedGame}`}
                            className="game-icon-expanded"
                        />
                    )}
                    <div className="endgame-text-container">
                        <AnimatedTitle text={`「小怪獸的飛行器填充完燃料，可以踏上返家的旅程，也感謝同學一路來的幫助，在這幾週一起成長，遊戲雖然結束，但同學還是要把握機會繼續增進自己的能力😄」`} />
                    </div>
                    <div className="button-container fade-in-and-grow">
                        <div className="game-button exit-button" onClick={exitGame}></div>
                    </div>
                </>
            )}

        </div>
    );


};

export default GameSelector;
