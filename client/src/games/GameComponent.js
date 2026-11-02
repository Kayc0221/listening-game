// GameComponent.js — 一個遊戲的流程：說明頁 → 逐關遊玩 → 溝通小訣竅
import React, { useState, useEffect } from 'react';
import { GAMES, TIP_CLASS } from './gameConfig';
import { useAuth } from '../contexts/AuthContext';
import './GameComponent.css';
import ShowTips from '../components/ShowTips';
import { getGameData } from '../api';

const GameComponent = ({ gameType, selectedGames, username, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [gameDatas, setGameDatas] = useState([]);  // 從MongoDB獲取的題目
    const { setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);

    useEffect(() => {
        let isMounted = true; // 用來追蹤組件是否還在掛載
        const fetchGameDatas = async () => {
            try {
                const data = await getGameData(selectedGames[currentLevel]);
                if (isMounted) {
                    setGameDatas(data);
                }
            } catch (error) {
                console.error("Failed to fetch game data:", error);
            }
        };

        fetchGameDatas();

        return () => {
            isMounted = false;
        };
    }, [currentLevel, username, selectedGames]);

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

    useEffect(() => {
        if (isLevelCompleted) {
            nextLevel();
        }
    }, [isLevelCompleted]);

    const game = GAMES[gameType];
    if (!game) {
        return <div>未知的遊戲</div>;
    }
    const Level = game.levelComponent(currentLevel);

    return (
        <>
            <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        <Level
                            choicedGamedata={gameDatas || []}
                            username={username}
                            setIsLevelCompleted={setIsLevelCompleted}
                        />
                    ) : (
                        <>
                            <h1 className="level-name">{game.name}</h1>
                            <div className="description-container">
                                <p className="description-text">{game.description}</p>
                                <button className="start-game-button" onClick={() => setIsGameStarted(true)}>
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
                    <ShowTips classValue={TIP_CLASS} onClick={onGameEnd} />
                </>
            )}
        </>
    );
};

export default GameComponent;
