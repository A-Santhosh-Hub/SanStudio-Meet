import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId } from '../lib/roomId';
import { useAuth, ROLE_COLORS } from '../context/AuthContext';


const MEET_ICON = (
    <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
        <rect width="36" height="36" rx="10" fill="url(#grad)" />
        <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <path d="M10 14h8v8h-8z" fill="white" rx="2" />
        <path d="M20 16l6-3v10l-6-3v-4z" fill="white" />
    </svg>
);

const FEATURES = [
    { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Your conversations are always secure' },
    { icon: '⚡', title: 'Ultra Low Latency', desc: 'HD video with < 100ms delay' },
    { icon: '📱', title: 'Works Everywhere', desc: 'Desktop, mobile, tablet — no app needed' },
    { icon: '👥', title: 'Host Controls', desc: 'Full control over your meeting room' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedLocal, setCopiedLocal] = useState(false);
    const [generatedRoomId, setGeneratedRoomId] = useState('');
    const [localLink, setLocalLink] = useState('');
    const [networkLink, setNetworkLink] = useState('');
    const [showCreateCard, setShowCreateCard] = useState(false);
    const [particles, setParticles] = useState([]);

    const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.student;
    // coaches, PM Sir, and admin can create meetings
    const canCreate = user?.role === 'coach' || user?.role === 'pm' || user?.role === 'admin';

    useEffect(() => {
        // Generate floating particles
        setParticles(
            Array.from({ length: 20 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 6 + 2,
                duration: Math.random() * 8 + 6,
                delay: Math.random() * 5,
                opacity: Math.random() * 0.4 + 0.1,
            }))
        );
    }, []);

    const handleCreate = async () => {
        const roomId = generateRoomId();
        setGeneratedRoomId(roomId);

        // Always create a localhost link for the host's own browser
        const local = `${window.location.protocol}//${window.location.hostname}:5173/join/${roomId}`;
        setLocalLink(local);

        // Fetch the server's LAN IP for a shareable network link
        try {
            const res = await fetch('/api/server-info');
            const data = await res.json();
            const ip = data.lanIP && data.lanIP !== 'localhost' ? data.lanIP : window.location.hostname;
            const network = `https://${ip}:5173/join/${roomId}`;
            setNetworkLink(network);
        } catch {
            setNetworkLink(local); // fallback
        }

        setShowCreateCard(true);
    };

    const handleJoinNow = () => {
        navigate(`/join/${generatedRoomId}?host=true`);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setJoining(true);
        // Extract just the room ID — works with full URL or bare code
        const raw = joinCode.trim();
        let roomId = raw;
        if (raw.includes('/join/')) {
            roomId = raw.split('/join/').pop().split('?')[0].trim();
        } else if (raw.includes('/')) {
            roomId = raw.split('/').pop().split('?')[0].trim();
        }
        setTimeout(() => navigate(`/join/${roomId}`), 300);
    };

    const copyLink = (link, setFlag) => {
        navigator.clipboard.writeText(link);
        setFlag(true);
        setTimeout(() => setFlag(false), 2000);
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', !isDark);
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen animated-gradient relative overflow-hidden flex flex-col">
            {/* Floating Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-indigo-400 pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
                    }}
                />
            ))}

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">SanStudio Meet</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Role badge */}
                    <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
                        {roleColor.label}
                    </div>
                    <span className="text-white text-sm font-medium hidden md:block">{user?.displayName || user?.username}</span>
                    <button onClick={toggleTheme}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                        title="Toggle theme">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </button>
                    <button onClick={() => { logout(); navigate('/login'); }}
                        className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-white/10 hover:bg-white/20 text-white transition-all">
                        Logout
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium mb-8 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    No sign-up required · Free forever
                </div>

                <h1 className="text-white text-center font-extrabold leading-tight mb-6 animate-slide-in-up"
                    style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)' }}>
                    Video Meetings<br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Built for Everyone
                    </span>
                </h1>

                <p className="text-slate-300 text-center text-lg md:text-xl max-w-xl mb-12 leading-relaxed animate-fade-in">
                    Crystal-clear HD video, real-time chat, screen sharing — all from your browser.
                    No downloads. No hassle.
                </p>

                {/* Main Action Cards */}
                <div className={`w-full max-w-2xl grid ${canCreate ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-sm'} gap-4 animate-slide-in-up`}>
                    {/* Create Meeting — host only */}
                    {canCreate ? (
                        <div className="glass-card p-6 flex flex-col gap-4 bg-white/5 border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Create Meeting</p>
                                    <p className="text-slate-400 text-sm">Get a shareable link instantly</p>
                                </div>
                            </div>

                            {!showCreateCard ? (
                                <button onClick={handleCreate} className="btn-primary btn-ripple w-full">
                                    🎥 New Meeting
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    {/* Network link */}
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">📡 Share with others on your network:</p>
                                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                            <span className="text-slate-300 text-xs flex-1 truncate">{networkLink || localLink}</span>
                                            <button onClick={() => copyLink(networkLink || localLink, setCopied)}
                                                className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-semibold whitespace-nowrap">
                                                {copied ? '✓ Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Local link */}
                                    {networkLink && networkLink !== localLink && (
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">🖥️ Local (this device):</p>
                                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                                                <span className="text-slate-400 text-xs flex-1 truncate">{localLink}</span>
                                                <button onClick={() => copyLink(localLink, setCopiedLocal)}
                                                    className="text-slate-400 hover:text-slate-300 transition-colors text-xs font-semibold whitespace-nowrap">
                                                    {copiedLocal ? '✓' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleJoinNow} className="btn-primary btn-ripple w-full">
                                        🚀 Start Meeting
                                    </button>
                                    <button onClick={() => { setShowCreateCard(false); setGeneratedRoomId(''); setLocalLink(''); setNetworkLink(''); }}
                                        className="text-slate-400 text-sm text-center hover:text-slate-300 transition-colors">
                                        Generate new link
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // User role: no create card — show info instead
                        <div className="glass-card p-5 flex items-center gap-3 bg-white/5 border-white/10 text-slate-400 text-sm">
                            <span className="text-xl">ℹ️</span>
                            <p>Only <span className="text-yellow-400 font-semibold">Hosts</span> can create meetings. Ask a host for a meeting link to join.</p>
                        </div>
                    )}

                    {/* Join Meeting */}
                    <div className="glass-card p-6 flex flex-col gap-4 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Join a Meeting</p>
                                <p className="text-slate-400 text-sm">Enter ID or paste a link</p>
                            </div>
                        </div>
                        <form onSubmit={handleJoin} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter meeting code or link..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!joinCode.trim() || joining}
                                className="btn-secondary btn-ripple w-full disabled:opacity-40 disabled:cursor-not-allowed text-white bg-white/10 hover:bg-white/20 border-white/10"
                            >
                                {joining ? '⏳ Joining...' : '🔗 Join Meeting'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Features Row */}
                <div className="mt-16 w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 transition-all duration-200">
                            <span className="text-2xl">{f.icon}</span>
                            <p className="text-white text-sm font-semibold">{f.title}</p>
                            <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center border-t border-white/10">
                <a
                    href="https://sanstudio.neocities.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 text-sm hover:text-indigo-400 transition-colors duration-200 font-medium group"
                >
                    Developed by{' '}
                    <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold">SanStudio</span>
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                </a>
            </footer>
        </div>
    );
}
