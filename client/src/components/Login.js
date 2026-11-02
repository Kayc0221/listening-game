import React, { useState } from 'react';
import { login } from '../api';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        try {
            const data = await login(username, password);
            if (data.success) {
                onLoginSuccess(username);
            } else {
                setError('帳號或密碼錯誤');
            }
        } catch (err) {
            console.error('Login failed', err);
            setError('無法連線到伺服器，請稍後再試');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
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
                onKeyDown={handleKeyDown}
            />
            <input
                className="input-field"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button className="button" onClick={handleLogin}>Login</button>
            {error && <p style={{ color: 'white', textShadow: '2px 2px 4px black' }}>{error}</p>}
        </div>
    );
}

export default Login;
