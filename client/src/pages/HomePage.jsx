import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId } from '../lib/roomId';
import { useAuth, ROLE_COLORS } from '../context/AuthContext';

const FEATURES = [
    { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Meetings secured with WebRTC encryption' },
    { icon: '⚡', title: 'Ultra Low Latency', desc: 'HD video with < 100ms delay' },
    { icon: '📱', title: 'Works Everywhere', desc: 'No downloads needed — browser only' },
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

    const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.student;
    const canCreate = user?.role === 'coach' || user?.role === 'pm' || user?.role === 'admin';

    const handleCreate = async () => {
        const roomId = generateRoomId();
        setGeneratedRoomId(roomId);
        const local = `${window.location.protocol}//${window.location.hostname}:5173/join/${roomId}`;
        setLocalLink(local);
        try {
            const res = await fetch('/api/server-info');
            const data = await res.json();
            const ip = data.lanIP && data.lanIP !== 'localhost' ? data.lanIP : window.location.hostname;
            setNetworkLink(`https://${ip}:5173/join/${roomId}`);
        } catch {
            setNetworkLink(local);
        }
        setShowCreateCard(true);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const code = joinCode.trim();
        if (!code) return;
        setJoining(true);
        const roomId = code.includes('/') ? code.split('/').pop() : code;
        setTimeout(() => navigate(`/join/${roomId}`), 200);
    };

    const copy = (text, setFlag) => {
        navigator.clipboard.writeText(text);
        setFlag(true);
        setTimeout(() => setFlag(false), 1800);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="min-h-screen" style={{ background: '#f5f5f5' }}>

            {/* ── Header ── */}
            <header className="bg-white border-b sticky top-0 z-30"
                style={{ borderColor: '#e5e5e5' }}>
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#2D8CFF' }}>
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                                <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                                <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                            </svg>
                        </div>
                        <span className="font-bold text-base" style={{ color: '#1c1c1c' }}>SanStudio Meet</span>
                    </div>

                    {/* Right: role badge + name + actions */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
                                    {roleColor.label}
                                </span>
                                <span className="text-sm font-medium" style={{ color: '#1c1c1c' }}>
                                    {user.displayName || user.username}
                                </span>
                                {user.role === 'admin' && (
                                    <button onClick={() => navigate('/admin')}
                                        className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                                        style={{ background: '#f0f6ff', color: '#2D8CFF', border: '1px solid #c8deff' }}>
                                        Dashboard
                                    </button>
                                )}
                                <button onClick={handleLogout}
                                    className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                                    style={{ background: '#f5f5f5', color: '#747487', border: '1px solid #e5e5e5' }}>
                                    Sign Out
                                </button>
                            </>
                        )}
                        {!user && (
                            <button onClick={() => navigate('/login')}
                                className="btn-primary text-sm px-4 py-2">
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <main className="max-w-6xl mx-auto px-6 py-12">

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-3" style={{ color: '#1c1c1c', letterSpacing: '-0.02em' }}>
                        Video Meetings for Everyone
                    </h1>
                    <p className="text-lg" style={{ color: '#747487' }}>
                        Crystal-clear HD video · Real-time chat · Screen sharing
                    </p>
                </div>

                {/* ── Main action cards ── */}
                <div className="grid md:grid-cols-2 gap-5 mb-10 max-w-2xl mx-auto">

                    {/* Create meeting */}
                    {canCreate && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: '#e5e5e5' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                                    style={{ background: '#2D8CFF' }}>
                                    +
                                </div>
                                <div>
                                    <p className="font-semibold text-sm" style={{ color: '#1c1c1c' }}>Create Meeting</p>
                                    <p className="text-xs" style={{ color: '#747487' }}>Start instant meeting</p>
                                </div>
                            </div>

                            {!showCreateCard ? (
                                <button onClick={handleCreate}
                                    className="btn-primary btn-ripple w-full text-sm">
                                    🎥 New Meeting
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    {/* Share link */}
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: '#747487' }}>Share with participants:</p>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                            style={{ background: '#f0f6ff', border: '1px solid #c8deff' }}>
                                            <span className="text-xs flex-1 truncate font-mono" style={{ color: '#2D8CFF' }}>
                                                {networkLink || localLink}
                                            </span>
                                            <button onClick={() => copy(networkLink || localLink, setCopied)}
                                                className="text-xs font-semibold flex-shrink-0"
                                                style={{ color: '#2D8CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                {copied ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate(`/join/${generatedRoomId}?host=true`)}
                                        className="btn-primary btn-ripple w-full text-sm">
                                        🚀 Start Meeting Now
                                    </button>
                                    <button onClick={() => { setShowCreateCard(false); setGeneratedRoomId(''); }}
                                        className="text-xs text-center w-full"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0b0' }}>
                                        Generate new link
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Join meeting */}
                    <div className={`bg-white rounded-xl p-6 shadow-sm border ${!canCreate ? 'md:col-span-2 max-w-sm mx-auto w-full' : ''}`}
                        style={{ borderColor: '#e5e5e5' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                style={{ background: '#f5f5f5', color: '#2D8CFF', border: '1px solid #e5e5e5' }}>
                                →
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: '#1c1c1c' }}>Join a Meeting</p>
                                <p className="text-xs" style={{ color: '#747487' }}>Enter meeting code or link</p>
                            </div>
                        </div>
                        <form onSubmit={handleJoin} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter meeting code or link..."
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="meet-input text-sm"
                            />
                            <button type="submit" disabled={!joinCode.trim() || joining}
                                className="btn-secondary btn-ripple w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                {joining ? 'Joining…' : '🔗 Join Meeting'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Features grid ── */}
                <div className="mt-12">
                    <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6"
                        style={{ color: '#a0a0b0' }}>
                        Why SanStudio Meet
                    </p>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {FEATURES.map(f => (
                            <div key={f.title} className="bg-white rounded-xl p-5 border shadow-sm"
                                style={{ borderColor: '#e5e5e5' }}>
                                <span className="text-2xl mb-3 block">{f.icon}</span>
                                <p className="font-semibold text-sm mb-1" style={{ color: '#1c1c1c' }}>{f.title}</p>
                                <p className="text-xs leading-relaxed" style={{ color: '#747487' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="text-center py-8 mt-8 text-xs border-t"
                style={{ borderColor: '#e5e5e5', color: '#a0a0b0', background: '#fff' }}>
                <a href="https://sanstudio.neocities.org/" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2D8CFF' }}>SanStudio</a>
                {' '}· Video Meetings Platform
            </footer>
        </div>
    );
}
