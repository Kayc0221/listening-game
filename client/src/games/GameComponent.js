// GameComponent.js — 一個遊戲的流程：說明頁 → 逐關遊玩 → 溝通小訣竅
import React, { useState, useEffect, useRef } from 'react';
import { GAMES, TIP_CLASS } from './gameConfig';
import { useAuth } from '../contexts/AuthContext';
import './GameComponent.css';
import ShowTips from '../components/ShowTips';
import { getGameData } from '../api';
import { asset } from '../asset';

const LOAD_FAILED = 'LOAD_FAILED';

// 一進遊戲就在背景依序下載每一關的題目 (一次一個請求，不同時壓垮 Apps Script；每個請求約 2-3 秒)
const useLevelData = (selectedGames) => {
    const [levelData, setLevelData] = useState({}); // gameId -> 題目資料 或 LOAD_FAILED
    const [retryCount, setRetryCount] = useState(0);
    const loaded = useRef({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            for (const id of selectedGames) {
                if (cancelled) return;
                if (loaded.current[id]) continue;
                try {
                    const data = await getGameData(id);
                    // 已取消 (例如按了重試) 的那一輪拿到的資料不能標成已載入，否則新的一輪會跳過它，畫面一直停在載入中
                    if (cancelled) return;
                    loaded.current[id] = true;
                    setLevelData((prev) => ({ ...prev, [id]: data }));
                } catch (error) {
                    console.error("Failed to fetch game data:", error);
                    if (!cancelled) setLevelData((prev) => ({ ...prev, [id]: LOAD_FAILED }));
                }
            }
        })();
        return () => { cancelled = true; };
    }, [selectedGames, retryCount]);

    return [levelData, () => setRetryCount((n) => n + 1)];
};

// 某一關出錯時只影響這一關，不會整個畫面變白
class LevelErrorBoundary extends React.Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Level crashed:', error, info.componentStack);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({ error: null });
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="level-status">
                    <p>這一關出了點問題 😢</p>
                    <button className="level-status-button" onClick={this.props.onSkip}>跳過這一關</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const GameComponent = ({ gameType, selectedGames, username, onGameEnd }) => {
    const [currentLevel, setCurrentLevel] = useState(0);  // 目前的遊戲關卡
    const [isGameStarted, setIsGameStarted] = useState(false); // 遊戲是否已經開始
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const { setBackground } = useAuth();
    const [showExpandedTips, setShowExpandedTips] = useState(false);
    const [levelData, retryLoading] = useLevelData(selectedGames);
    const lastShown = useRef(null); // 上一個顯示過的 { Level, data }

    const nextLevel = () => {
        if (currentLevel < selectedGames.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setIsLevelCompleted(false);
        }
        else {
            setShowExpandedTips(true);
            setBackground(asset(`/image/tips-background.jpg`));
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
    const Level = game.levelComponent(currentLevel, selectedGames[currentLevel]);

    // 只用「這一關」的題目。還在下載時：同一個元件先沿用上一關的資料 (保留星星等進度) 但蓋上載入畫面擋住操作；
    // 換成另一個元件 (例如 ㄅㄅ森林 第 6 關換成 BForest2) 時不能沿用，否則資料格式不同會當掉
    const current = levelData[selectedGames[currentLevel]];
    const isReady = current !== undefined && current !== LOAD_FAILED;
    if (isReady) {
        lastShown.current = { Level, data: current };
    }
    const shownData = isReady ? current
        : (lastShown.current && lastShown.current.Level === Level ? lastShown.current.data : null);

    const loadingStatus = current === LOAD_FAILED ? (
        <div className="level-status">
            <p>題目載入失敗，請檢查網路連線</p>
            <button className="level-status-button" onClick={retryLoading}>重試</button>
        </div>
    ) : (
        <div className="level-status"><p>題目載入中…</p></div>
    );

    return (
        <>
            {/* 遊戲進行中在背景圖上加一層暗色漸層，題目和按鈕才不會被花俏的背景吃掉 */}
            {isGameStarted && !showExpandedTips && <div className="level-backdrop" />}
            {/* 顯示小訣竅時移除遊戲畫面：否則最後一關看不見的選項按鈕會蓋在小訣竅上，擋住「點擊後繼續」 */}
            {!showExpandedTips && <div className="game-container">
                <div className="fade-in-and-grow">
                    {isGameStarted ? (
                        shownData ? (
                            <LevelErrorBoundary resetKey={currentLevel} onSkip={() => setIsLevelCompleted(true)}>
                                <Level
                                    choicedGamedata={shownData}
                                    username={username}
                                    setIsLevelCompleted={setIsLevelCompleted}
                                />
                            </LevelErrorBoundary>
                        ) : loadingStatus
                    ) : (
                        <>
                            <h1 className="level-name">{game.name}</h1>
                            <div className="description-container">
                                <p className="description-text">{game.description}</p>
                                <button className="start-game-button" onClick={() => setIsGameStarted(true)}>
                                    <img src={asset('/image/icon/next.png')} alt="Next" className="next-icon" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>}
            {/* 沿用上一關畫面時，蓋一層擋住點擊，避免播到上一關的聲音 */}
            {isGameStarted && !showExpandedTips && shownData && !isReady && (
                <div className="level-loading-overlay">{loadingStatus}</div>
            )}
            {showExpandedTips && (
                <>
                    <img
                        src={asset(`/image/tips-background.jpg`)}
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
