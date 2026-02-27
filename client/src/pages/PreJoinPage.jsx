import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useAuth } from '../context/AuthContext';

export default function PreJoinPage() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const isHost = searchParams.get('host') === 'true';
    const navigate = useNavigate();
    const { user } = useAuth();

    const { stream, audioEnabled, videoEnabled, getMedia, toggleAudio, toggleVideo } = useMediaDevices();
    const [name, setName] = useState(() => user?.displayName || user?.username || localStorage.getItem('meet-name') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mediaError, setMediaError] = useState(null);
    const [joining, setJoining] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        fetch(`/api/room/${roomId}`)
            .then(r => r.json())
            .then(data => { setRoomInfo(data); setShowPassword(data.hasPassword && !isHost); setLoading(false); })
            .catch(() => setLoading(false));
    }, [roomId, isHost]);

    useEffect(() => {
        getMedia()
            .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
            .catch(err => {
                setMediaError(err.name === 'NotAllowedError'
                    ? 'Camera/mic permission denied. You can still join without video.'
                    : 'Could not access camera.');
            });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) videoRef.current.srcObject = stream;
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
        setTimeout(() => navigate(`/room/${roomId}?${params.toString()}`), 300);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: '#1c1c1c' }}>
                <div className="text-center">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-3"
                        style={{ borderColor: '#2D8CFF', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: '#a0a0b0' }}>Loading meeting…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col" style={{ background: '#1c1c1c' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <a href="/" className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: '#2D8CFF' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm" style={{ color: '#fff' }}>SanStudio Meet</span>
                </a>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#a0a0b0' }}>
                    {roomId}
                </span>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-start">

                    {/* Camera preview */}
                    <div className="flex-1">
                        <div className="video-tile rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            {mediaError ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                                    <span className="text-3xl mb-3">📵</span>
                                    <p className="text-sm" style={{ color: '#a0a0b0' }}>{mediaError}</p>
                                </div>
                            ) : (
                                <>
                                    <video ref={videoRef} autoPlay muted playsInline
                                        className="w-full h-full object-cover"
                                        style={{ display: videoEnabled ? 'block' : 'none' }} />
                                    {!videoEnabled && (
                                        <div className="avatar-placeholder">
                                            <span className="text-4xl font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                {name ? name[0].toUpperCase() : '?'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Controls overlay */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                <button onClick={toggleAudio}
                                    className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                                    style={{
                                        background: audioEnabled ? 'rgba(255,255,255,0.18)' : '#e34d26',
                                        color: '#fff',
                                    }}>
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
                                <button onClick={toggleVideo}
                                    className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                                    style={{
                                        background: videoEnabled ? 'rgba(255,255,255,0.18)' : '#e34d26',
                                        color: '#fff',
                                    }}>
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

                        {/* Device status indicators */}
                        <div className="flex gap-4 mt-3 px-1">
                            <span className="flex items-center gap-1.5 text-xs"
                                style={{ color: audioEnabled ? '#1d9b5e' : '#e34d26' }}>
                                <span className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: audioEnabled ? '#1d9b5e' : '#e34d26' }} />
                                Mic {audioEnabled ? 'On' : 'Off'}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs"
                                style={{ color: videoEnabled ? '#1d9b5e' : '#e34d26' }}>
                                <span className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: videoEnabled ? '#1d9b5e' : '#e34d26' }} />
                                Camera {videoEnabled ? 'On' : 'Off'}
                            </span>
                            {roomInfo?.participantCount > 0 && (
                                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#a0a0b0' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    {roomInfo.participantCount} in meeting
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Join form */}
                    <div className="w-full md:w-72 flex-shrink-0">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="font-bold text-lg mb-1" style={{ color: '#1c1c1c' }}>
                                {isHost ? 'Start Meeting' : 'Join Meeting'}
                            </h2>
                            <p className="text-sm mb-5" style={{ color: '#747487' }}>
                                {isHost ? 'You are the host' : 'Enter your name to join'}
                            </p>

                            <form onSubmit={handleJoin} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                                        style={{ color: '#747487' }}>
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your name…"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        autoFocus={!name}
                                        maxLength={40}
                                        className="meet-input text-sm"
                                    />
                                </div>

                                {showPassword && (
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                                            style={{ color: '#747487' }}>
                                            Meeting Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Enter password…"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="meet-input text-sm"
                                        />
                                    </div>
                                )}

                                <button type="submit"
                                    disabled={!name.trim() || joining}
                                    className="btn-primary btn-ripple w-full disabled:opacity-40 disabled:cursor-not-allowed">
                                    {joining ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Joining…
                                        </span>
                                    ) : isHost ? '🚀 Start Meeting' : '🔗 Join Meeting'}
                                </button>
                            </form>

                            <p className="text-center text-xs mt-4" style={{ color: '#c0c0c0' }}>
                                🔒 End-to-end WebRTC encryption
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
