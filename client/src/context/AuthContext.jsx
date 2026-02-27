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
export const isCoach = (user) => user?.role === 'coach';
export const isStudent = (user) => user?.role === 'student';
export const isPM = (user) => user?.role === 'pm';
export const isHost = (user) => user?.role === 'coach' || user?.role === 'admin' || user?.role === 'pm';
export const isUser = (user) => user?.role === 'student';

export const ROLE_COLORS = {
    admin: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'Admin' },
    coach: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Coach' },
    student: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Student' },
    pm: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'PM Sir' },
    // fallback aliases
    host: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Host' },
    user: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'User' },
};
