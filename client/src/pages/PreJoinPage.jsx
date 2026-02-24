import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMediaDevices } from '../hooks/useMediaDevices';

export default function PreJoinPage() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const isHost = searchParams.get('host') === 'true';
    const navigate = useNavigate();

    const { stream, audioEnabled, videoEnabled, getMedia, toggleAudio, toggleVideo } = useMediaDevices();
    const [name, setName] = useState(() => localStorage.getItem('meet-name') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mediaError, setMediaError] = useState(null);
    const [joining, setJoining] = useState(false);
    const videoRef = useRef(null);

    // Fetch room info
    useEffect(() => {
        fetch(`/api/room/${roomId}`)
            .then(r => r.json())
            .then(data => {
                setRoomInfo(data);
                setShowPassword(data.hasPassword && !isHost);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [roomId, isHost]);

    // Init camera preview
    useEffect(() => {
        getMedia()
            .then(s => {
                if (videoRef.current) videoRef.current.srcObject = s;
            })
            .catch(err => {
                setMediaError(err.name === 'NotAllowedError'
                    ? 'Camera/mic permission denied. You can still join without video.'
                    : 'Could not access camera.');
            });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem('meet-name', name.trim());
        setJoining(true);

        const params = new URLSearchParams({
            name: name.trim(),
            host: isHost ? 'true' : 'false',
            ...(password ? { password } : {}),
        });

        setTimeout(() => {
            navigate(`/room/${roomId}?${params.toString()}`);
        }, 400);
    };

    if (loading) {
        return (
            <div className="min-h-screen animated-gradient flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Loading meeting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
            <div className="w-full max-w-4xl animate-bounce-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                                <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                                <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                            </svg>
                        </div>
                        <span className="text-white font-bold">SanStudio Meet</span>
                    </a>
                    <h2 className="text-white text-2xl font-bold">Ready to join?</h2>
                    <p className="text-slate-400 text-sm mt-1">Meeting: <span className="text-indigo-400 font-mono">{roomId}</span></p>
                </div>

                <div className="grid md:grid-cols-5 gap-6">
                    {/* Camera Preview */}
                    <div className="md:col-span-3">
                        <div className="video-tile rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#1a1a2e' }}>
                            {mediaError ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                                    <span className="text-4xl mb-3">📵</span>
                                    <p className="text-slate-400 text-sm">{mediaError}</p>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                        style={{ display: videoEnabled ? 'block' : 'none' }}
                                    />
                                    {!videoEnabled && (
                                        <div className="avatar-placeholder">
                                            <span className="text-5xl font-bold text-white/80">
                                                {name ? name[0].toUpperCase() : '?'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                <button
                                    onClick={toggleAudio}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${audioEnabled
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-red-500 hover:bg-red-600 text-white mic-muted-pulse'
                                        }`}
                                >
                                    {audioEnabled ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={toggleVideo}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${videoEnabled
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                        }`}
                                >
                                    {videoEnabled ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mic test indicator */}
                        {audioEnabled && (
                            <div className="mt-3 flex items-center gap-2 px-4">
                                <span className="text-slate-400 text-xs">Mic level:</span>
                                <div className="flex gap-1">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="w-1 rounded-full bg-indigo-500/40"
                                            style={{ height: `${8 + Math.random() * 12}px`, animation: `waitPulse ${0.8 + i * 0.1}s ${i * 0.05}s ease-in-out infinite` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Join Form */}
                    <div className="md:col-span-2 flex flex-col gap-5">
                        <div className="glass-card p-6 bg-white/5 border-white/10 flex flex-col gap-4">
                            <h3 className="text-white font-semibold text-lg">Your Info</h3>

                            <form onSubmit={handleJoin} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                        required
                                        maxLength={40}
                                        className="px-4 py-3 rounded-xl w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                                    />
                                </div>

                                {showPassword && (
                                    <div>
                                        <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
                                            Meeting Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Enter password..."
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="px-4 py-3 rounded-xl w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                                        />
                                    </div>
                                )}

                                {/* Status indicators */}
                                <div className="flex flex-col gap-2">
                                    <div className={`flex items-center gap-2 text-xs ${audioEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                                        Microphone: {audioEnabled ? 'Ready' : 'Muted'}
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${videoEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${videoEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                                        Camera: {videoEnabled ? 'Ready' : 'Off'}
                                    </div>
                                    {roomInfo?.participantCount > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                            {roomInfo.participantCount} already in meeting
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!name.trim() || joining}
                                    className="btn-primary btn-ripple w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {joining ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            {isHost ? '🚀 Start Meeting' : '🔗 Join Meeting'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="glass-card p-4 bg-white/3 border-white/8 text-center">
                            <p className="text-slate-400 text-xs">
                                🔒 This meeting uses end-to-end WebRTC encryption
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <a href="https://sanstudio.neocities.org/" target="_blank" rel="noopener noreferrer"
                    className="text-slate-500 text-xs hover:text-indigo-400 transition-colors">
                    Developed by <span className="text-indigo-500 font-semibold">SanStudio</span>
                </a>
            </div>
        </div>
    );
}
