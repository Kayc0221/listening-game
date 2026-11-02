/* eslint-disable jsx-a11y/alt-text */
//app.js
import React, { useState, useEffect } from 'react';
import { useAuth} from './contexts/AuthContext';
import logo from './assets/new-logo.png';
import './App.css';  // 引入CSS文件
import Login from './components/Login';  // 引入 Login 組件
import VolumeControl from './components/VolumeControl';  // 引入 AudioPlayer 組件
import ShootingStars from './components/ShootingStars';
import ProgressBar from './components/ProgressBar';
import CursorTail from './components/CursorTail';
import { useAudio } from './contexts/AudioContext';

import CloudMessage from './components/CloudMessage'; // 確保路徑正確

const App = () => {
    const { addAudio, playAudio } = useAudio();
    //const [isAuthenticated, setIsAuthenticated] = useState(false);
    //const [currentUser, setCurrentUser] = useState(null);
    const { isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser, background } = useAuth();
    const [animationClass, setAnimationClass] = useState("App-logo"); // 初始化為 "App-logo"


    const handleLoginSuccess = async (username) => {
        let Audio1_Idx;
        Audio1_Idx = await addAudio(`background-music.mp3`, true, true);
        await playAudio(Audio1_Idx);
        setIsAuthenticated(true);
        setCurrentUser(username);
    };

   
    //const audioElement = new Audio('/background-music.mp3');

    useEffect(() => {
        if (isAuthenticated) {
            // 延遲，然後更改動畫
            setTimeout(() => {
                setAnimationClass("move-to-top-right-and-fade");
            }, 0);
        } else {
            setAnimationClass("App-logo");
        }
    }, [isAuthenticated]);

    return (
        <div className="App background-image" style={{ backgroundImage: `url(${background})` }}>
            <CursorTail />
            <VolumeControl />
            <ShootingStars />
            <header className="App-header">
                <img src={logo} className={animationClass} alt="logo" />
                {
                    !isAuthenticated && (
                        <div className="welcome-message">
                            <h1 style={{ color: 'white' }}>
                                「這是一個聽覺訓練的遊戲，一共分為噪音下語音聽辨、快速語音辨識、聲韻覺識以及聽覺工作記憶四個部分，四個訓練將以遊戲形式隨機呈現於每次練習，就讓我們一起努力吧！」
                            </h1>
                        </div>
                    )
                }
                {isAuthenticated ? (
                    <div>
                        <ProgressBar username={currentUser} />
                        <div className={`user-profile fade-in-and-grow`}>
                            <img src="/image/icon/profile-user.png" className="user-profile-png" />
                            <span className="user-profile-text">{currentUser}</span>
                        </div>
                        <CloudMessage currentUser={currentUser} />
                    </div>
                ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                )}
            </header>
        </div>
    );

};

export default App;
