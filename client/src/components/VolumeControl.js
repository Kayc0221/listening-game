import React, { useState } from 'react';
import './VolumeControl.css';
import { useAudio } from '../contexts/AudioContext';

const VolumeControl = () => {
    const { setAudioVolume, volume, pauseAudio, playAudio } = useAudio();
    const [previousVolume, setPreviousVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(false);

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value;
        setAudioVolume(newVolume);
        setPreviousVolume(newVolume);
    };

    const handleIconClick = () => {
        if (isMuted) {
            playAudio(0);
            setAudioVolume(previousVolume);
            setIsMuted(false);
        } else {
            pauseAudio(0);
            setAudioVolume(0);
            setIsMuted(true);
        }
    };

    let volumeIconSrc;
    if (volume < 0.01) {
        volumeIconSrc = '/image/icon/volume-mute.png';
    } else if (volume < 0.5) {
        volumeIconSrc = '/image/icon/volume-low.png';
    } else if (volume < 1) {
        volumeIconSrc = '/image/icon/volume-medium.png';
    } else {
        volumeIconSrc = '/image/icon/volume-high.png';
    }

    return (
        <div className="volume-container">
            <img className="volume-icon" src={volumeIconSrc} alt="Volume Icon" onClick={handleIconClick} />
            <input
                className="volume-slider"
                type="range"
                id="volumeSlider"
                value={volume}
                min="0"
                max="1"
                step="0.01"
                onChange={handleVolumeChange}
            />
        </div>
    );
};

export default VolumeControl;
