import React, { useState, useEffect } from 'react';
import './GameSelector.css';
import { useAudio } from '../contexts/AudioContext';

import { useAuth } from '../contexts/AuthContext';
import GameComponent from './GameComponent';
import { GAMES } from './gameConfig';
import AnimatedTitle from '../components/AnimatedTitle';
import { ApiError, getPlayedGames, selectRandomGames, waitForPendingScores } from '../api';
import { asset } from '../asset';
import { TOTAL_SESSIONS, completedSessions, countedLevels } from '../progress';


const GameSelector = ({ username }) => {
    const { setIsAuthenticated, setCurrentUser, setBackground, refreshProgress } = useAuth();
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedGames, setSelectedGames] = useState([]); // 在這裡宣告

    const [isAnimating, setIsAnimating] = useState(false);
    const [canConfirm, setCanConfirm] = useState(false);
    const [showExpandedGame, setShowExpandedGame] = useState(false);
    const [gameRounds, setGameRounds] = useState(0); // 今天已經玩完幾個遊戲；4 = 今天的冒險結束
    const [notice, setNotice] = useState(null); // 暫時取代輪盤下方訊息的提示 (例如某個遊戲沒有題目)
    const [isJourneyComplete, setIsJourneyComplete] = useState(false);

    const [availableGames, setAvailableGames] = useState([1, 2, 3, 4]);
    const { pauseAudio, removeAudio } = useAudio();


    const gameName = GAMES[selectedGame]?.name;

    // 先在背景下載之後會用到的大張背景圖，換場時就不用等圖片
    useEffect(() => {
        ['/image/tips-background.jpg', '/image/End-round.jpg', '/image/hint.jpg', '/image/endding.jpg']
            .forEach((path) => { new Image().src = asset(path); });
    }, []);

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
        setBackground(asset(`/image/main-menu.jpg`));
    };

    // 取得這個遊戲要玩的關卡；回傳 null 表示這個遊戲目前沒有新題目
    const fetchRandomGames = async (gameType) => {
        let games;
        try {
            games = (await selectRandomGames(username, gameType)).selectedGames;
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return null;
            }
            throw error;
        }

        // ㄅㄅ森林 (3) 的後段關卡使用 gameType 5 的題目
        if (gameType === 3) {
            try {
                games = [...games, ...(await selectRandomGames(username, 5)).selectedGames];
            } catch (error) {
                console.error("Failed to fetch games for gameType 5:", error);
            }
        }
        return games;
    };

    // 輪盤停下後：先拿到題目才展開遊戲；沒有題目就換下一個遊戲，而不是直接登出
    const prepareGame = async (gameType, remainingGames) => {
        const shownAt = Date.now();
        let games;
        try {
            games = await fetchRandomGames(gameType);
        } catch (error) {
            console.error("Failed to fetch random games:", error);
            window.alert("無法連線到伺服器，請稍後再試！");
            exitGame();
            return;
        }

        if (games && games.length) {
            setSelectedGames(games);
            // 維持原本「停下 2 秒後展開」的節奏
            setTimeout(() => setShowExpandedGame(true), Math.max(0, 2000 - (Date.now() - shownAt)));
            return;
        }

        if (remainingGames.length) {
            setNotice(`${GAMES[gameType].name} 目前沒有新的題目，換一個遊戲吧！`);
            setTimeout(() => {
                setNotice(null);
                startGameAnimation();
            }, 3000);
        } else if (gameRounds > 0) {
            setGameRounds(4); // 剩下的遊戲都沒有題目：直接結束今天的冒險
        } else {
            window.alert("目前沒有可以玩的遊戲了！返回主選單！");
            exitGame();
        }
    };

    const handleGameEnd = () => {
        setShowExpandedGame(false);
        waitForPendingScores().then(refreshProgress); // 最後一關的分數寫完再更新燃料
        if (!availableGames.length) {
            setGameRounds(4);
            return;
        }
        setCanConfirm(false);
        setGameRounds(prevRounds => prevRounds + 1);
        setTimeout(() => setCanConfirm(true), 5000);
        setTimeout(startGameAnimation, 5000);
    }

    // 今天的冒險結束：如果 36 次冒險都完成了，顯示最終結局
    useEffect(() => {
        if (gameRounds !== 4) return;
        setBackground(asset(`/image/hint.jpg`));
        waitForPendingScores()
            .then(() => getPlayedGames(username))
            .then((data) => setIsJourneyComplete(completedSessions(countedLevels(data.playedGames)) >= TOTAL_SESSIONS))
            .catch((error) => console.error('Error fetching played games:', error));
    }, [gameRounds]);


    useEffect(() => {
        let gameIndex = 0;
        let speed = 100;
        let elapsedTime = 0;
        let totalTime = 1000 * availableGames.length + Math.random() * 2000; // 基本時間加上隨機值
        // 先公平地抽好要停在哪個遊戲，輪盤轉夠久之後再轉到它才停下
        // (之前停在哪裡由轉動時間決定，各遊戲機率不平均，第一輪常常停在同一個遊戲)
        const targetGame = availableGames[Math.floor(Math.random() * availableGames.length)];
        let cancelled = false; // 轉動中登出時停止，避免之後的 prepareGame 影響下一個登入的人
        let timer;


        const runAnimation = () => {
            const currentGame = availableGames[gameIndex];
            setSelectedGame(currentGame);
            gameIndex = (gameIndex + 1) % availableGames.length; // 使其循環
            elapsedTime += speed;

            if (elapsedTime < totalTime || currentGame !== targetGame) {
                speed += (15 + Math.random() * 10);  // 逐漸變慢
                timer = setTimeout(() => { if (!cancelled) runAnimation(); }, speed);
            } else {
                setCanConfirm(true);
                setIsAnimating(false);

                // 移除選擇的遊戲，然後準備它的題目
                const remainingGames = availableGames.filter(game => game !== currentGame);
                setAvailableGames(remainingGames);
                prepareGame(currentGame, remainingGames);
            }
        };

        if (isAnimating) {
            runAnimation();
        }
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isAnimating]);

    useEffect(() => {
        if (showExpandedGame) {
            const timer = setTimeout(() => {
                setBackground(asset(`/image/game${selectedGame}.jpg`));
            }, 3000);  // 假设动画时长为 3 秒

            return () => clearTimeout(timer);  // 清除定时器
        }
    }, [showExpandedGame]);

    function getMessageByRound(gameRounds) {
        switch (gameRounds) {
            case 0:
                return "那我們今天就在 " + gameName + " 中開始我們的冒險吧";
            case 1:
                return "接下來就去 " + gameName + " 中尋找更多燃料吧！";
            case 2:
                return "雷達上發現 " + gameName + " 中有燃料的反應！";
            case 3:
                return "最後的挑戰是 " + gameName + " 努力堅持到最後吧！";
            case 4:
                return "Hello, " + username + " 讓我們開始旅程吧!!"
            case 5:
                return "恭喜你在 " + gameName + " 中找到了一些燃料！"
            case 6:
                return "看來努力是會有回報的 " + username + " 你表現得很好！"
            case 7:
                return "沒想到在 " + gameName + " 中還有這麼多燃料！"
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
                            <img src={asset('/image/game1.jpg')} alt="Game Icon 1" className={`game-icon ${selectedGame === 1 ? 'highlight' : ''} ${!availableGames.includes(1) ? 'disabled' : ''}`} />
                            <img src={asset('/image/game2.jpg')} alt="Game Icon 2" className={`game-icon ${selectedGame === 2 ? 'highlight' : ''} ${!availableGames.includes(2) ? 'disabled' : ''}`} />
                        </div>
                        <div className="game-row">
                            <img src={asset('/image/game3.jpg')} alt="Game Icon 3" className={`game-icon ${selectedGame === 3 ? 'highlight' : ''} ${!availableGames.includes(3) ? 'disabled' : ''}`} />
                            <img src={asset('/image/game4.jpg')} alt="Game Icon 4" className={`game-icon ${selectedGame === 4 ? 'highlight' : ''} ${!availableGames.includes(4) ? 'disabled' : ''}`} />
                        </div>
                    </div>
                    <div className="controls">
                        {gameRounds === 0 && !canConfirm && (
                            <div className="button-container fade-in-and-grow">
                                <div className="game-button start-button" onClick={startGameAnimation}></div>
                                <div className="game-button exit-button" onClick={exitGame}></div>
                            </div>
                        )}
                        <div className="text-container ">
                            <h1>{notice || getMessageByRound(canConfirm ? gameRounds : gameRounds + 4)}</h1>
                        </div>
                    </div>
                </>
             )}
            
            {showExpandedGame && gameRounds <4 && (
                <>
                    <img
                        src={asset(`/image/game${selectedGame}.jpg`)}
                        alt={`Game Icon ${selectedGame}`}
                        className="game-icon-expanded"
                    />
                    <GameComponent
                        selectedGames={selectedGames}
                        username={username}
                        gameType={selectedGame}
                        onGameEnd={handleGameEnd} 
                    />
                </>
            )}
            {gameRounds === 4 && !isJourneyComplete && (
                <>
                    <img
                        src={asset(`/image/End-round.jpg`)}
                        alt={`Game Icon ${selectedGame}`}
                        className="game-icon-expanded"
                    />
                    <div className="endgame-text-container">
                        <AnimatedTitle text={`「小怪獸成功在今天的冒險中找到了一些燃料，但還不足以發射火箭，還請同學多多幫忙小怪獸尋找燃料，讓他可以早日回家😄」`} />
                    </div>
                    <div className="button-container fade-in-and-grow">
                        <div className="game-button exit-button" onClick={exitGame}></div>
                    </div>
                </>
            )}

            {gameRounds === 4 && isJourneyComplete && (
                <>
                    <img
                        src={asset(`/image/endding.jpg`)}
                        alt={`Game Icon ${selectedGame}`}
                        className="game-icon-expanded"
                    />
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
