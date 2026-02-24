import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sanstudio_meet_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const persist = (userData) => {
        if (userData) localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        else localStorage.removeItem(STORAGE_KEY);
        setUser(userData);
    };

    const login = useCallback(async (username, password) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return false; }
            persist(data.user);
            return true;
        } catch {
            setError('Connection error. Is the server running?');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        persist(null);
    }, []);

    const clearError = () => setError('');

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

// Role helpers
export const isAdmin = (user) => user?.role === 'admin';
export const isHost = (user) => user?.role === 'host' || user?.role === 'admin';
export const isUser = (user) => user?.role === 'user';

export const ROLE_COLORS = {
    admin: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', label: 'Admin' },
    host: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Host' },
    user: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', label: 'User' },
};
