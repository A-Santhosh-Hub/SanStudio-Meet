import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, error, clearError } = useAuth();

    // roleTab: 'student' | 'coach' | 'pm' | 'admin'
    const [roleTab, setRoleTab] = useState('student');
    const [form, setForm] = useState({ username: '', password: '' });

    const set = (field) => (e) => {
        clearError();
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await login(form.username, form.password);
        if (ok) {
            const stored = JSON.parse(localStorage.getItem('sanstudio_meet_user') || 'null');
            if (stored?.role === 'admin') navigate('/admin');
            else navigate('/');
        }
    };

    const switchTab = (tab) => {
        setRoleTab(tab);
        clearError();
        setForm({ username: '', password: '' });
    };

    const tabs = [
        { key: 'student', label: 'Student' },
        { key: 'coach', label: 'Coach' },
        { key: 'pm', label: 'PM Sir' },
    ];

    return (
        <div className="min-h-screen flex" style={{ background: '#f5f5f5' }}>

            {/* ── Left panel — branding ── */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
                style={{ background: '#1c1c1c', color: '#fff' }}>
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: '#2D8CFF' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight">SanStudio Meet</span>
                </div>

                {/* Centre tagline */}
                <div>
                    <h2 className="text-3xl font-bold leading-snug mb-4">
                        Meet, Collaborate<br />and Learn Together
                    </h2>
                    <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>
                        HD video meetings, real-time chat and screen sharing — all from your browser.
                    </p>
                </div>

                {/* Footer */}
                <p style={{ color: '#555', fontSize: '0.75rem' }}>
                    © 2025 SanStudio · Powered by WebRTC
                </p>
            </div>

            {/* ── Right panel — form ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">

                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: '#2D8CFF' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg" style={{ color: '#1c1c1c' }}>SanStudio Meet</span>
                </div>

                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="bg-white rounded-xl shadow-sm border"
                        style={{ borderColor: '#e5e5e5' }}>

                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <h1 className="text-xl font-bold" style={{ color: '#1c1c1c' }}>
                                {roleTab === 'admin' ? 'Admin Sign In' : 'Sign In'}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: '#747487' }}>
                                {roleTab === 'pm'
                                    ? 'PM Sir — instant access to all meetings'
                                    : roleTab === 'admin'
                                        ? 'Administrator portal'
                                        : 'Enter your credentials to continue'}
                            </p>
                        </div>

                        {/* Tabs (not for admin) */}
                        {roleTab !== 'admin' && (
                            <div className="flex px-8 gap-0 border-b" style={{ borderColor: '#e5e5e5' }}>
                                {tabs.map(t => (
                                    <button key={t.key} onClick={() => switchTab(t.key)}
                                        className="py-3 px-4 text-sm font-medium relative transition-colors"
                                        style={{
                                            color: roleTab === t.key ? '#2D8CFF' : '#747487',
                                            marginBottom: '-1px',
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: roleTab === t.key ? '2px solid #2D8CFF' : '2px solid transparent',
                                            cursor: 'pointer',
                                        }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: '#747487' }}>
                                    {roleTab === 'student' ? 'Student ID' : roleTab === 'coach' ? 'Coach ID' : 'Username'}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your ID"
                                    value={form.username}
                                    onChange={set('username')}
                                    required
                                    autoFocus
                                    className="meet-input"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: '#747487' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={set('password')}
                                    required
                                    className="meet-input"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                    style={{ background: '#fff5f5', border: '1px solid #fdd', color: '#cc2200' }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary btn-ripple w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={roleTab === 'admin' ? { background: '#1c1c1c' } : {}}>
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>

                        </form>

                        {/* Demo accounts */}
                        <div className="mx-8 mb-8 p-4 rounded-lg" style={{ background: '#f8f8f8', border: '1px solid #e5e5e5' }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: '#a0a0b0' }}>DEMO ACCOUNTS</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: '#747487' }}>
                                <div><span className="font-mono font-semibold" style={{ color: '#1c1c1c' }}>admin / admin123</span> — Admin</div>
                                <div><span className="font-mono font-semibold" style={{ color: '#1c1c1c' }}>coach / coach123</span> — Coach</div>
                                <div><span className="font-mono font-semibold" style={{ color: '#2D8CFF' }}>pm / pm123</span> — PM Sir</div>
                                <div><span className="font-mono font-semibold" style={{ color: '#1c1c1c' }}>student / student123</span> — Student</div>
                            </div>
                        </div>
                    </div>

                    {/* Admin link below card */}
                    <div className="text-center mt-5">
                        {roleTab !== 'admin' ? (
                            <button onClick={() => switchTab('admin')}
                                className="text-sm"
                                style={{ color: '#747487', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Sign in as Administrator →
                            </button>
                        ) : (
                            <button onClick={() => switchTab('student')}
                                className="text-sm"
                                style={{ color: '#2D8CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                                ← Back to Student / Coach
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
