import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext'; // 確保路徑正確
const apiBaseUrl = process.env.REACT_APP_API_URL;

function Login(props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');


    const handleLogin = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
        
            if (!response.ok) {
                throw new Error(`Server error ${response.status}`);
            }
        
            const data = await response.json();
            if (data.success) {
                props.onLoginSuccess(username); // 使用 props 里的 onLoginSuccess 函数
                console.log(`Login successful with ${username}`);
            } else {
                console.log(`Incorrect login`);
            }
        } catch (error) {
            console.error('Login failed', error);
        }
        
    };


    const handleKeyPress = (e) => {
        // 檢測是否按下 Enter 鍵（鍵碼為 13）
        if (e.key === 'Enter') {
            handleLogin(); // 在按下 Enter 時觸發登錄函數
        }
    };

    return (
        <div>
            <input
                className="input-field"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress} // 新增這行
            />
            <input
                className="input-field"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress} // 新增這行
            />
            <button className="button" onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
