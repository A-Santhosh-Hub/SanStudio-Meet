import React, { useState, useRef, useEffect } from 'react';

const REACTIONS = ['👍', '👏', '❤️', '😂', '😮', '🎉', '🔥', '💪'];

export default function ControlsBar({
    audioEnabled, videoEnabled, screenSharing, recording,
    isHost, roomLocked, handRaised, userRole, controlMode, canSpeak,
    onToggleAudio, onToggleVideo, onToggleScreen,
    onToggleChat, onToggleParticipants, onToggleWhiteboard, onToggleNotes,
    onReaction, onRaiseHand, onRecord,
    onToggleLock, onEndMeeting, onSettings, onSwitchMode,
    chatOpen, participantsOpen, whiteboardOpen, notesOpen,
    elapsedTime, unreadChat,
}) {
    // 'student' role has restricted controls
    const isStudent = userRole === 'student';
    const isPrivileged = userRole === 'admin' || userRole === 'coach' || isHost;

    // Check if media controls are disabled for the student
    const mediaDisabled = isStudent && !canSpeak && controlMode !== 'open';

    const [showReactions, setShowReactions] = useState(false);
    const reactionsRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (reactionsRef.current && !reactionsRef.current.contains(e.target)) {
                setShowReactions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="relative" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
            {/* Reactions Popup */}
            {showReactions && (
                <div ref={reactionsRef}
                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 glass-card px-4 py-3 flex gap-3 animate-slide-in-up z-50"
                    style={{ background: 'var(--bg-card)' }}>
                    {REACTIONS.map(emoji => (
                        <button key={emoji}
                            onClick={() => { onReaction(emoji); setShowReactions(false); }}
                            className="text-2xl hover:scale-150 transition-transform cursor-pointer"
                            title={emoji}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
                {/* Left — Timer */}
                <div className="flex items-center gap-3 min-w-[80px]">
                    <div className="flex items-center gap-2">
                        {recording && <span className="w-2.5 h-2.5 rounded-full bg-red-500 record-dot" />}
                        <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {formatTime(elapsedTime)}
                        </span>
                    </div>
                </div>

                {/* Center — Main Controls */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    {/* Mic */}
                    <div className="tooltip-wrap">
                        <button
                            onClick={onToggleAudio}
                            disabled={mediaDisabled}
                            className={`ctrl-btn btn-ripple ${!audioEnabled ? 'danger mic-muted-pulse' : ''} ${mediaDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-xl">{audioEnabled ? '🎤' : '🔇'}</span>
                            <span>{audioEnabled ? 'Mute' : 'Unmute'}</span>
                        </button>
                        <span className="tooltip-text">{mediaDisabled ? 'Blocked by Host' : (audioEnabled ? 'Mute mic' : 'Unmute mic')}</span>
                    </div>

                    {/* Camera */}
                    <div className="tooltip-wrap">
                        <button onClick={onToggleVideo} disabled={mediaDisabled} className={`ctrl-btn btn-ripple ${!videoEnabled ? 'danger' : ''} ${mediaDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-xl">{videoEnabled ? '📹' : '📷'}</span>
                            <span>{videoEnabled ? 'Hide' : 'Show'}</span>
                        </button>
                        <span className="tooltip-text">{mediaDisabled ? 'Blocked by Host' : (videoEnabled ? 'Turn off camera' : 'Turn on camera')}</span>
                    </div>

                    {/* Screen Share */}
                    <div className="tooltip-wrap">
                        <button onClick={onToggleScreen} className={`ctrl-btn btn-ripple ${screenSharing ? 'active' : ''}`}>
                            <span className="text-xl">🖥️</span>
                            <span>{screenSharing ? 'Stop' : 'Share'}</span>
                        </button>
                        <span className="tooltip-text">{screenSharing ? 'Stop sharing' : 'Share screen'}</span>
                    </div>

                    {/* Chat */}
                    <div className="tooltip-wrap relative">
                        <button onClick={onToggleChat} className={`ctrl-btn btn-ripple ${chatOpen ? 'active' : ''}`}>
                            <span className="text-xl">💬</span>
                            <span>Chat</span>
                        </button>
                        {unreadChat > 0 && !chatOpen && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {unreadChat > 9 ? '9+' : unreadChat}
                            </span>
                        )}
                        <span className="tooltip-text">Chat</span>
                    </div>

                    {/* Participants */}
                    <div className="tooltip-wrap">
                        <button onClick={onToggleParticipants} className={`ctrl-btn btn-ripple ${participantsOpen ? 'active' : ''}`}>
                            <span className="text-xl">👥</span>
                            <span>People</span>
                        </button>
                        <span className="tooltip-text">Participants</span>
                    </div>

                    {/* Raise Hand */}
                    <div className="tooltip-wrap">
                        <button onClick={onRaiseHand} className={`ctrl-btn btn-ripple ${handRaised ? 'active' : ''}`}>
                            <span className={`text-xl ${handRaised ? 'hand-raised inline-block' : ''}`}>✋</span>
                            <span>{handRaised ? 'Lower' : 'Hand'}</span>
                        </button>
                        <span className="tooltip-text">{handRaised ? 'Lower hand' : 'Raise hand'}</span>
                    </div>

                    {/* Reactions */}
                    <div className="tooltip-wrap">
                        <button onClick={() => setShowReactions(s => !s)} className={`ctrl-btn btn-ripple ${showReactions ? 'active' : ''}`}>
                            <span className="text-xl">😀</span>
                            <span>React</span>
                        </button>
                        <span className="tooltip-text">Reactions</span>
                    </div>

                    {/* Whiteboard */}
                    <div className="tooltip-wrap hidden md:flex">
                        <button onClick={onToggleWhiteboard} className={`ctrl-btn btn-ripple ${whiteboardOpen ? 'active' : ''}`}>
                            <span className="text-xl">✏️</span>
                            <span>Board</span>
                        </button>
                        <span className="tooltip-text">Whiteboard</span>
                    </div>

                    {/* Notes */}
                    <div className="tooltip-wrap hidden md:flex">
                        <button onClick={onToggleNotes} className={`ctrl-btn btn-ripple ${notesOpen ? 'active' : ''}`}>
                            <span className="text-xl">📝</span>
                            <span>Notes</span>
                        </button>
                        <span className="tooltip-text">Notes</span>
                    </div>

                    {/* Record — hidden for student role */}
                    {isPrivileged && (
                        <div className="tooltip-wrap">
                            <button onClick={onRecord} className={`ctrl-btn btn-ripple ${recording ? 'danger' : ''}`}>
                                {recording ? <span className="text-xl">⏹️</span> : <span className="text-xl">⏺️</span>}
                                <span>{recording ? 'Stop' : 'Record'}</span>
                            </button>
                            <span className="tooltip-text">{recording ? 'Stop recording' : 'Record meeting'}</span>
                        </div>
                    )}

                    {/* Settings */}
                    <div className="tooltip-wrap">
                        <button onClick={onSettings} className="ctrl-btn btn-ripple">
                            <span className="text-xl">⚙️</span>
                            <span>Settings</span>
                        </button>
                        <span className="tooltip-text">Settings</span>
                    </div>

                    {/* Lock (host/privileged only) */}
                    {isPrivileged && (
                        <div className="tooltip-wrap">
                            <button onClick={onToggleLock} className={`ctrl-btn btn-ripple ${roomLocked ? 'active' : ''}`}>
                                <span className="text-xl">{roomLocked ? '🔒' : '🔓'}</span>
                                <span>{roomLocked ? 'Locked' : 'Lock'}</span>
                            </button>
                            <span className="tooltip-text">{roomLocked ? 'Unlock room' : 'Lock room'}</span>
                        </div>
                    )}

                    {/* Mode Switcher */}
                    {isPrivileged && (
                        <div className="tooltip-wrap flex flex-col items-center justify-center">
                            <select
                                value={controlMode}
                                onChange={(e) => onSwitchMode(e.target.value)}
                                className="bg-white/10 text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none border border-white/20 mt-1 cursor-pointer hover:bg-white/20">
                                <option value="lecture">Lecture Mode</option>
                                <option value="interactive">Interactive</option>
                                <option value="open">Open Mode</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Right — Leave/End */}
                <div className="flex items-center min-w-[80px] justify-end">
                    <button
                        onClick={onEndMeeting}
                        className="btn-danger btn-ripple flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl">
                        {isHost ? '⏻ End' : '← Leave'}
                    </button>
                </div>
            </div>
        </div>
    );
}
