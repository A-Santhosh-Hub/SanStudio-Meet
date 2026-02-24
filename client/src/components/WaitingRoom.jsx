import React from 'react';

export default function WaitingRoom({ waitingUsers, onAdmit, onDeny, isHost }) {
    if (isHost) {
        return (
            <div className="fixed inset-0 z-50 flex items-end md:items-start justify-center md:justify-end p-4 pointer-events-none">
                <div className="glass-card p-5 max-w-sm w-full pointer-events-auto animate-slide-in-up shadow-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Waiting Room ({waitingUsers.length})
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                        {waitingUsers.map(user => (
                            <div key={user.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {user.name[0].toUpperCase()}
                                </div>
                                <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => onAdmit(user.id)}
                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-500/15 hover:bg-green-500/30 text-green-400 border border-green-500/20 transition-all">
                                        Admit
                                    </button>
                                    <button onClick={() => onDeny(user.id)}
                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition-all">
                                        Deny
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Non-host waiting screen
    return (
        <div className="fixed inset-0 z-50 animated-gradient flex items-center justify-center">
            <div className="glass-card p-10 text-center max-w-sm w-full animate-bounce-in"
                style={{ background: 'rgba(24,24,37,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">⏳</span>
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Waiting to join</h2>
                <p className="text-slate-400 text-sm mb-6">The host will admit you shortly.</p>
                <div className="flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 wait-dot" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 wait-dot" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 wait-dot" />
                </div>
            </div>
        </div>
    );
}
