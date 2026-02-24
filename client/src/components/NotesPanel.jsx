import React, { useState, useEffect } from 'react';

export default function NotesPanel({ roomId, onClose }) {
    const key = `meet-notes-${roomId}`;
    const [notes, setNotes] = useState(() => localStorage.getItem(key) || '');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(key, notes);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        }, 800);
        return () => clearTimeout(timer);
    }, [notes, key]);

    const handleDownload = () => {
        const blob = new Blob([notes], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `meeting-notes-${roomId}.txt`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Meeting Notes</span>
                    {saved && <span className="text-xs text-green-400 animate-fade-in">✓ Saved</span>}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownload} title="Download notes"
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 text-indigo-400 text-sm transition-all">
                        ⬇
                    </button>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 text-sm transition-all"
                        style={{ color: 'var(--text-secondary)' }}>✕</button>
                </div>
            </div>
            <div className="flex-1 p-4">
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Take notes during your meeting...&#10;&#10;• Key decisions&#10;• Action items&#10;• Follow-ups"
                    className="w-full h-full resize-none outline-none bg-transparent text-sm leading-relaxed"
                    style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
                />
            </div>
            <div className="px-4 pb-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {notes.length} characters · Auto-saved locally
                </p>
            </div>
        </div>
    );
}
