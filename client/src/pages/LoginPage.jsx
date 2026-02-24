import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, error, clearError } = useAuth();

    // roleTab: 'student' | 'coach' | 'admin'
    const [roleTab, setRoleTab] = useState('student');
    const [form, setForm] = useState({ username: '', password: '' });

    const set = (field) => (e) => {
        clearError();
        setForm(f => ({ ...f, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let ok;
        if (roleTab === 'student') {
            ok = await login(form.username, form.password);
        } else if (roleTab === 'coach') {
            ok = await login(form.username, form.password);
        } else if (roleTab === 'admin') {
            ok = await login(form.username, form.password);
        }

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

    return (
        <div className="min-h-screen animated-gradient flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Admin Login Button (Top Right) */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => switchTab('admin')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${roleTab === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}>
                    👑 Admin Login
                </button>
            </div>

            {/* Floating blobs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <circle cx="12" cy="12" r="3" fill="indigo" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight text-center">ALP Astrology<br /><span className="text-lg text-indigo-300">Learning Platform</span></h1>
                </div>

                {/* Card */}
                <div className="glass-card shadow-2xl overflow-hidden" style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>

                    {/* Tabs for Student and Coach (hide if Admin) */}
                    {roleTab !== 'admin' && (
                        <div className="flex border-b border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <button onClick={() => switchTab('student')}
                                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${roleTab === 'student' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                                🎓 Student
                                {roleTab === 'student' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                            </button>
                            <button onClick={() => switchTab('coach')}
                                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${roleTab === 'coach' ? 'text-yellow-400' : 'text-slate-400 hover:text-white'}`}>
                                👨‍🏫 Coach
                                {roleTab === 'coach' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500" />}
                            </button>
                        </div>
                    )}

                    {/* Admin Header */}
                    {roleTab === 'admin' && (
                        <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/10">
                            <h2 className="text-red-400 font-bold text-center">Admin Portal</h2>
                        </div>
                    )}

                    <div className="p-6">

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                    {roleTab === 'student' ? 'Student ID (Username)' : roleTab === 'coach' ? 'Coach ID' : 'Username'}
                                </label>
                                <input type="text" placeholder="Enter ID" value={form.username} onChange={set('username')} required autoFocus
                                    className="meet-input bg-white/5 text-white border-white/10 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                    Password
                                </label>
                                <input type="password" placeholder="Enter password" value={form.password} onChange={set('password')} required
                                    className="meet-input bg-white/5 text-white border-white/10 focus:border-indigo-500" />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20">
                                    <span className="text-sm">⚠️</span>
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className={`btn-ripple w-full mt-2 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${roleTab === 'admin' ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/25' :
                                        roleTab === 'coach' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:shadow-yellow-500/25' :
                                            'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/25'} hover:shadow-lg`}>
                                {loading ? '⏳ Please wait...' : 'Login'}
                            </button>
                        </form>

                        {/* Hint for demo */}
                        <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-indigo-300 text-[10px] uppercase font-semibold mb-1">🔑 Demo Accounts</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                <div><span className="text-white font-mono">admin / admin123</span><br />(Admin)</div>
                                <div><span className="text-white font-mono">coach / coach123</span><br />(Coach)</div>
                                <div className="col-span-2"><span className="text-white font-mono">student / student123</span> (Student)</div>
                            </div>
                        </div>

                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    ALP Astrology Course Platform
                </p>
            </div>
        </div>
    );
}
