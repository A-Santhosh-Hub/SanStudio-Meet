import React, { useState } from 'react';

export default function SettingsPanel({ devices, onDeviceChange, onClose }) {
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');
    const [dataSaver, setDataSaver] = useState(false);

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', !isDark);
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    const isDark = document.documentElement.classList.contains('dark');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="glass-card w-full max-w-md animate-bounce-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Settings</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
                </div>

                <div className="p-5 flex flex-col gap-6">
                    {/* Video Device */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>📹 Camera</label>
                        <select
                            value={selectedCamera}
                            onChange={e => { setSelectedCamera(e.target.value); onDeviceChange?.(e.target.value, 'videoinput'); }}
                            className="meet-input text-sm"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' }}>
                            <option value="">Default camera</option>
                            {devices.cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</option>)}
                        </select>
                    </div>

                    {/* Mic Device */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>🎤 Microphone</label>
                        <select
                            value={selectedMic}
                            onChange={e => { setSelectedMic(e.target.value); onDeviceChange?.(e.target.value, 'audioinput'); }}
                            className="meet-input text-sm"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' }}>
                            <option value="">Default microphone</option>
                            {devices.microphones.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</option>)}
                        </select>
                    </div>

                    {/* Speaker */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>🔊 Speaker</label>
                        <select
                            value={selectedSpeaker}
                            onChange={e => setSelectedSpeaker(e.target.value)}
                            className="meet-input text-sm"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' }}>
                            <option value="">Default speaker</option>
                            {devices.speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 6)}`}</option>)}
                        </select>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-col gap-4">
                        {/* Dark mode */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>🌙 Dark Mode</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-detected from system</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isDark ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Data saver */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>📶 Data Saver</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lowers video quality to save bandwidth</p>
                            </div>
                            <button
                                onClick={() => setDataSaver(s => !s)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${dataSaver ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${dataSaver ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="text-center border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                        <a href="https://sanstudio.neocities.org/" target="_blank" rel="noopener noreferrer"
                            className="text-xs hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
                            Developed by <span className="text-indigo-500 font-semibold">SanStudio</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
