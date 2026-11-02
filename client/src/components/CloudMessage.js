import React, { useState, useEffect } from 'react';
import './CloudMessage.css';
import { useAudio } from '../contexts/AudioContext';
import GameSelector from '../games/GameSelector'; // 確保導入 GameSelector 組件


const CloudMessage = ({ currentUser }) => {
  const [showGameSelector, setShowGameSelector] = useState(false);
  const { addAudio, playAudio } = useAudio();

  useEffect(() => {
    const timer = setTimeout(() => {
      const audioIndex = addAudio(`cloudMsg.mp3`);
      playAudio(audioIndex);
    }, 2000); // 5000 毫秒後自動轉場

    return () => clearTimeout(timer); // 清理計時器
  }, []);

  if (showGameSelector) {
    return <GameSelector username={currentUser} />;
  }

  return (
    <div className="cloud-container cloud-fade-in-and-grow" onClick={() => setShowGameSelector(true)}>
      <div className="cloud">
        <div className="text-container-cloud">
          <p>小怪獸來自遙遠的外太空，需要在地球收集燃料，才能啟動飛行船回家。讓我們一起完成四個遊戲，幫助小怪獸收集燃料，啟航回家吧！<br />
            點擊後繼續...
          </p>
        </div>
      </div>
    </div>
  );  
}

export default CloudMessage;
