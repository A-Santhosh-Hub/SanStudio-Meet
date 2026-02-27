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

    const icons = {
        info: 'ℹ️', success: '✅', warning: '⚠️',
        error: '❌', reaction: '🎉', request: '🔔',
    };
    const borderColors = {
        info: '#4f46e5', success: '#16a34a', warning: '#ca8a04',
        error: '#dc2626', reaction: '#7c3aed', request: '#2D8CFF',
    };
    const bgOpacity = {
        info: 'rgba(79,70,229,0.1)', success: 'rgba(22,163,74,0.1)',
        warning: 'rgba(202,138,4,0.1)', error: 'rgba(220,38,38,0.1)',
        reaction: 'rgba(124,58,237,0.1)', request: 'rgba(45,140,255,0.12)',
    };

    useEffect(() => {
        if (!toast.actions) {
            const timer = setTimeout(() => setVisible(false), toast.duration || 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!visible) return null;

    const isRequest = toast.type === 'request' && toast.actions?.length;

    return (
        <div
            className="pointer-events-auto rounded-xl flex flex-col gap-2 toast-enter"
            style={{
                minWidth: isRequest ? '280px' : '220px',
                maxWidth: '340px',
                background: 'var(--bg-card)',
                border: `1px solid ${borderColors[toast.type] || borderColors.info}40`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.35), inset 0 0 0 1px ${borderColors[toast.type] || borderColors.info}15`,
                padding: '12px 14px',
            }}
        >
            {/* Message row */}
            <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{icons[toast.type] || 'ℹ️'}</span>
                <p className="text-sm font-medium flex-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {toast.message}
                </p>
            </div>

            {/* Action buttons row (request toasts only) */}
            {isRequest && (
                <div className="flex gap-2 ml-8">
                    {toast.actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
                            style={action.style === 'accept' ? {
                                background: '#2D8CFF',
                                color: '#fff',
                            } : {
                                background: 'rgba(255,255,255,0.08)',
                                color: '#9ca3af',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
