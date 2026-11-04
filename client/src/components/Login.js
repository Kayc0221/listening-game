import React, { useState } from 'react';
import { login } from '../api';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        // 登入請求要 2-3 秒：期間再按 Enter / Login 不要重送 (之前會登入兩次、背景音樂播兩首)
        if (isSubmitting) return;
        setIsSubmitting(true);
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
        } finally {
            setIsSubmitting(false);
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
            <button className="button" onClick={handleLogin} disabled={isSubmitting}>{isSubmitting ? '登入中…' : 'Login'}</button>
            {error && <p style={{ color: 'white', textShadow: '2px 2px 4px black' }}>{error}</p>}
        </div>
    );
}

export default Login;
