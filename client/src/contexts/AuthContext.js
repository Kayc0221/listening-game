// AuthContext.js
import React, { createContext, useState, useContext } from 'react';
import { asset } from '../asset';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [background, setBackground] = useState(asset('/image/main-menu.jpg'));
    const [shownTips, setShownTips] = useState([]); // 新增 shownTips 狀態
    const [progressVersion, setProgressVersion] = useState(0); // 改變時 ProgressBar 重新讀取進度
    const refreshProgress = () => setProgressVersion((v) => v + 1);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            setIsAuthenticated,
            currentUser,
            setCurrentUser,
            background,
            setBackground,
            shownTips,
            setShownTips,
            progressVersion,
            refreshProgress
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
