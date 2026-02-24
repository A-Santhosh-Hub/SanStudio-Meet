import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import PreJoinPage from './pages/PreJoinPage';
import MeetingRoom from './pages/MeetingRoom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

// Protected route: redirect to /login if not authenticated
function ProtectedRoute({ children, requireRole }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;
    return children;
}

// Admin guard: redirect admin away from home to /admin
function HomeGuard() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <HomePage />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomeGuard />} />
            <Route path="/admin" element={
                <ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/join/:roomId" element={<ProtectedRoute><PreJoinPage /></ProtectedRoute>} />
            <Route path="/room/:roomId" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored) {
            document.documentElement.classList.toggle('dark', stored === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }, []);

    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
