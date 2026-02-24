import React, { useState, useRef, useEffect } from 'react';

const EMOJIS = ['😀', '😂', '❤️', '👍', '👏', '🎉', '🔥', '😮', '😢', '🤔', '👋', '💪', '🙏', '✅', '⭐'];

function FileMessage({ msg }) {
    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = msg.fileData;
        a.download = msg.fileName;
        a.click();
    };

    return (
        <div onClick={handleDownload}
            className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-all">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                📎
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{msg.fileName}</p>
                <p className="text-slate-400 text-xs">Click to download</p>
            </div>
        </div>
    );
}

export default function ChatPanel({ messages, onSend, onFileShare, onClose }) {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [dragging, setDragging] = useState(false);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e?.preventDefault();
        const msg = text.trim();
        if (!msg) return;
        onSend(msg);
        setText('');
        setShowEmoji(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiClick = (emoji) => {
        setText(t => t + emoji);
        setShowEmoji(false);
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be under 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            onFileShare({ fileName: file.name, fileType: file.type, fileData: reader.result });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = () => {
                onFileShare({ fileName: file.name, fileType: file.type, fileData: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="flex flex-col h-full"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Chat</span>
                    {messages.length > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </div>
                <button onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    ✕
                </button>
            </div>

            {/* Drag indicator */}
            {dragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/20 border-2 border-dashed border-indigo-400 rounded-xl z-10 pointer-events-none">
                    <p className="text-indigo-400 font-semibold">Drop file to share</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <span className="text-4xl opacity-30">💬</span>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet.<br />Say hello! 👋</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className="animate-fade-in">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{msg.sender}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(msg.timestamp)}</span>
                        </div>
                        {msg.type === 'file' ? (
                            <FileMessage msg={msg} />
                        ) : (
                            <div className="px-3 py-2 rounded-xl text-sm leading-relaxed inline-block max-w-full break-words"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                {msg.message}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Emoji Picker */}
            {showEmoji && (
                <div className="p-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                    {EMOJIS.map(e => (
                        <button key={e} onClick={() => handleEmojiClick(e)}
                            className="text-xl hover:scale-125 transition-transform cursor-pointer">
                            {e}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-end gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message... (Enter to send)"
                            rows={1}
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none transition-all"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1.5px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                maxHeight: '100px',
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowEmoji(s => !s)}
                                className={`text-lg hover:scale-110 transition-transform ${showEmoji ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                😊
                            </button>
                            <button onClick={() => fileInputRef.current?.click()}
                                className="text-lg opacity-60 hover:opacity-100 transition-opacity">
                                📎
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 btn-ripple"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
