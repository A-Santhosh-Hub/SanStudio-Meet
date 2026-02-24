import React, { useEffect, useState } from 'react';

export default function Toast({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} />
            ))}
        </div>
    );
}

function ToastItem({ toast }) {
    const [visible, setVisible] = useState(true);

    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', reaction: '🎉' };
    const colors = {
        info: 'border-indigo-500/30 bg-indigo-500/10',
        success: 'border-green-500/30 bg-green-500/10',
        warning: 'border-yellow-500/30 bg-yellow-500/10',
        error: 'border-red-500/30 bg-red-500/10',
        reaction: 'border-purple-500/30 bg-purple-500/10',
    };

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), toast.duration || 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    if (!visible) return null;

    return (
        <div className={`pointer-events-auto glass-card px-4 py-3 flex items-center gap-3 toast-enter border ${colors[toast.type] || colors.info}`}
            style={{ minWidth: '220px', maxWidth: '320px', background: 'var(--bg-card)' }}>
            <span className="text-lg flex-shrink-0">{icons[toast.type] || 'ℹ️'}</span>
            <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
        </div>
    );
}
