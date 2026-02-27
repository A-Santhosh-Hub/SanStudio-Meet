import React, { useState } from 'react';

/**
 * Action button helper — small icon button with tooltip
 */
function ActionBtn({ onClick, title, emoji, color = 'blue', disabled = false }) {
    const colorMap = {
        blue: 'hover:bg-blue-500/20 text-blue-400',
        green: 'hover:bg-green-500/20 text-green-400',
        orange: 'hover:bg-orange-500/20 text-orange-400',
        red: 'hover:bg-red-500/20 text-red-400',
        purple: 'hover:bg-purple-500/20 text-purple-400',
        gray: 'hover:bg-white/10 text-gray-400',
    };
    return (
        <div className="relative group/btn">
            <button
                onClick={onClick}
                disabled={disabled}
                title={title}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm
                            transition-all ${colorMap[color]}
                            ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span>{emoji}</span>
            </button>
            {/* Tooltip */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2
                             bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap
                             opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
                {title}
            </span>
        </div>
    );
}

export default function ParticipantsPanel({
    participants, localId, isHost, userRole,
    onKick, onMuteUser, onMuteAll, onClose, socket, roomId,
}) {
    const isPrivileged = isHost || userRole === 'admin' || userRole === 'coach' || userRole === 'pm';

    // Requested state — track if we already asked someone (per participant)
    const [requestedAudio, setRequestedAudio] = useState({});   // { [id]: true }
    const [requestedVideo, setRequestedVideo] = useState({});   // { [id]: true }

    const askUnmuteAudio = (targetId) => {
        socket?.emit('request-unmute-audio', { targetId, roomId });
        setRequestedAudio(p => ({ ...p, [targetId]: true }));
        setTimeout(() => setRequestedAudio(p => { const n = { ...p }; delete n[targetId]; return n; }), 8000);
    };

    const askVideoOn = (targetId) => {
        socket?.emit('request-video-on', { targetId, roomId });
        setRequestedVideo(p => ({ ...p, [targetId]: true }));
        setTimeout(() => setRequestedVideo(p => { const n = { ...p }; delete n[targetId]; return n; }), 8000);
    };

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Participants</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full font-semibold"
                        style={{ background: 'rgba(45,140,255,0.15)', color: '#2D8CFF' }}>
                        {participants.length}
                    </span>
                </div>
                <button onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>

            {/* Host quick actions */}
            {isPrivileged && (
                <div className="p-3 border-b flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
                    <button onClick={onMuteAll}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
                        🔇 Mute All
                    </button>
                </div>
            )}

            {/* Participant list */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {participants.map((p) => {
                    const isMe = p.id === localId;
                    const isStudent = p.role === 'student';
                    const canActOn = isPrivileged && !isMe;

                    return (
                        <div key={p.id}
                            className="rounded-xl p-3 flex flex-col gap-2 group"
                            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>

                            {/* Row 1: Avatar + name + badges + status icons */}
                            <div className="flex items-center gap-2">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                    style={{ background: '#2D8CFF' }}>
                                    {(p.name || 'U')[0].toUpperCase()}
                                </div>

                                {/* Name + role badges */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {p.name}
                                        </span>
                                        {isMe && <span className="text-xs" style={{ color: '#2D8CFF' }}>(You)</span>}
                                        {p.isHost && <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                                            style={{ background: 'rgba(45,140,255,0.15)', color: '#2D8CFF' }}>HOST</span>}
                                        {p.role === 'admin' && <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>ADMIN</span>}
                                        {p.role === 'coach' && <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                                            style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24' }}>COACH</span>}
                                        {p.role === 'pm' && <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>PM SIR</span>}
                                        {p.role === 'student' && <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                                            style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}>STUDENT</span>}
                                    </div>
                                    {p.handRaised && (
                                        <span className="text-xs text-yellow-400 hand-raised inline-block">✋ Raised hand</span>
                                    )}
                                </div>

                                {/* Status indicators */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <span title={p.muted ? 'Muted' : 'Unmuted'}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                        style={{ background: p.muted ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}>
                                        {p.muted ? '🔇' : '🎤'}
                                    </span>
                                    <span title={p.videoOff ? 'Camera off' : 'Camera on'}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                        style={{ background: p.videoOff ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)' }}>
                                        {p.videoOff ? '📷' : '📹'}
                                    </span>
                                    {p.canSpeak && (
                                        <span title="Allowed to speak" className="w-6 h-6 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-xs">🗣️</span>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Action buttons — only for privileged over OTHER participants */}
                            {canActOn && (
                                <div className="flex items-center gap-1 flex-wrap pt-1 border-t"
                                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

                                    {/* ── AUDIO CONTROLS ── */}
                                    <div className="flex items-center gap-0.5 mr-1">
                                        <span className="text-[9px] uppercase tracking-wide mr-1"
                                            style={{ color: '#6b7280' }}>Mic</span>

                                        {/* Ask to unmute */}
                                        {p.muted && (
                                            <ActionBtn
                                                emoji={requestedAudio[p.id] ? '⏳' : '🎙️'}
                                                title={requestedAudio[p.id] ? 'Request sent…' : 'Ask to Unmute'}
                                                color="blue"
                                                disabled={!!requestedAudio[p.id]}
                                                onClick={() => askUnmuteAudio(p.id)}
                                            />
                                        )}

                                        {/* Force mute */}
                                        {!p.muted && (
                                            <ActionBtn
                                                emoji="🔇"
                                                title="Force Mute"
                                                color="orange"
                                                onClick={() => onMuteUser(p.id)}
                                            />
                                        )}

                                        {/* Allow / Revoke speak (students only) */}
                                        {isStudent && !p.canSpeak && (
                                            <ActionBtn
                                                emoji="✅"
                                                title="Allow to Speak"
                                                color="green"
                                                onClick={() => socket?.emit('allow-student', { roomId, targetId: p.id })}
                                            />
                                        )}
                                        {isStudent && p.canSpeak && (
                                            <ActionBtn
                                                emoji="🚫"
                                                title="Revoke Speaking"
                                                color="orange"
                                                onClick={() => socket?.emit('revoke-student', { roomId, targetId: p.id })}
                                            />
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

                                    {/* ── VIDEO CONTROLS ── */}
                                    <div className="flex items-center gap-0.5 mr-1">
                                        <span className="text-[9px] uppercase tracking-wide mr-1"
                                            style={{ color: '#6b7280' }}>Cam</span>

                                        {/* Ask to turn on video */}
                                        {p.videoOff && (
                                            <ActionBtn
                                                emoji={requestedVideo[p.id] ? '⏳' : '📹'}
                                                title={requestedVideo[p.id] ? 'Request sent…' : 'Ask to Turn On Camera'}
                                                color="blue"
                                                disabled={!!requestedVideo[p.id]}
                                                onClick={() => askVideoOn(p.id)}
                                            />
                                        )}

                                        {/* Force camera off */}
                                        {!p.videoOff && (
                                            <ActionBtn
                                                emoji="📷"
                                                title="Force Camera Off"
                                                color="orange"
                                                onClick={() => socket?.emit('force-video-off', { targetId: p.id, roomId })}
                                            />
                                        )}

                                        {/* Allow video (students in lecture mode) */}
                                        {isStudent && !p.canShowVideo && (
                                            <ActionBtn
                                                emoji="🎥"
                                                title="Allow Camera"
                                                color="green"
                                                onClick={() => socket?.emit('allow-video', { targetId: p.id, roomId })}
                                            />
                                        )}
                                        {isStudent && p.canShowVideo && (
                                            <ActionBtn
                                                emoji="🚫"
                                                title="Revoke Camera"
                                                color="orange"
                                                onClick={() => socket?.emit('revoke-video', { targetId: p.id, roomId })}
                                            />
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

                                    {/* ── KICK ── */}
                                    <ActionBtn
                                        emoji="✕"
                                        title="Remove from meeting"
                                        color="red"
                                        onClick={() => onKick(p.id)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            {isPrivileged && (
                <div className="p-3 border-t text-[10px] leading-5" style={{ borderColor: 'var(--border-color)', color: '#6b7280' }}>
                    <span className="font-semibold text-xs" style={{ color: '#9ca3af' }}>Actions: </span>
                    🎙️ Ask Unmute · 🔇 Force Mute · ✅ Allow Speak · 📹 Ask Cam · 📷 Force Cam Off · 🎥 Allow Cam
                </div>
            )}
        </div>
    );
}
