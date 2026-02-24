import React from 'react';

export default function ParticipantsPanel({ participants, localId, isHost, onKick, onMuteUser, onMuteAll, onClose, socket, roomId }) {
    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Participants</span>
                    <span className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">
                        {participants.length}
                    </span>
                </div>
                <button onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    ✕
                </button>
            </div>

            {/* Mute All (host only) */}
            {isHost && (
                <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                        onClick={onMuteAll}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition-all bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20">
                        🔇 Mute All
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {participants.map((p) => (
                    <div key={p.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all group"
                        style={{ border: '1px solid var(--border-color)' }}>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(p.name || 'U')[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                    {p.name}
                                </span>
                                {p.id === localId && (
                                    <span className="text-xs text-indigo-400">(You)</span>
                                )}
                                {p.isHost && (
                                    <span className="px-1.5 py-0.5 text-xs bg-yellow-500/15 text-yellow-500 rounded font-semibold">HOST</span>
                                )}
                            </div>
                            {p.handRaised && (
                                <span className="text-xs text-yellow-400 hand-raised inline-block">✋ Raised hand</span>
                            )}
                            {p.role === 'coach' && <span className="text-[10px] ml-1 px-1 bg-yellow-500/20 text-yellow-300 rounded">COACH</span>}
                            {p.role === 'admin' && <span className="text-[10px] ml-1 px-1 bg-red-500/20 text-red-300 rounded">ADMIN</span>}
                        </div>

                        {/* Status Icons */}
                        <div className="flex items-center gap-1.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${p.muted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {p.muted ? '🔇' : '🎤'}
                            </span>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${p.videoOff ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {p.videoOff ? '📷' : '📹'}
                            </span>
                        </div>

                        {/* Host Actions */}
                        {isHost && p.id !== localId && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {p.role === 'student' && !p.canSpeak && (
                                    <button
                                        onClick={() => socket?.emit('allow-student', { roomId, targetId: p.id })}
                                        title="Allow to Speak"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-green-500/20 text-green-400 transition-all">
                                        🗣️
                                    </button>
                                )}
                                {p.role === 'student' && p.canSpeak && (
                                    <button
                                        onClick={() => socket?.emit('revoke-student', { roomId, targetId: p.id })}
                                        title="Revoke Speaking"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-orange-500/20 text-orange-400 transition-all">
                                        🤫
                                    </button>
                                )}
                                <button
                                    onClick={() => onMuteUser(p.id)}
                                    title="Mute"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-orange-500/20 text-orange-400 transition-all">
                                    🔇
                                </button>
                                <button
                                    onClick={() => onKick(p.id)}
                                    title="Remove"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-red-500/20 text-red-400 transition-all">
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
