import React, { useRef, useEffect, useState } from 'react';

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#000000', '#ffffff'];

export default function WhiteboardPanel({ socket, roomId, onClose }) {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#6366f1');
    const [brushSize, setBrushSize] = useState(4);
    const [mode, setMode] = useState('pen'); // 'pen' | 'eraser'
    const lastPos = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Listen for remote draw events
    useEffect(() => {
        if (!socket) return;
        const handler = ({ data }) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(data.x1, data.y1);
            ctx.lineTo(data.x2, data.y2);
            ctx.stroke();
        };
        socket.on('whiteboard-draw', handler);
        socket.on('whiteboard-clear', () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        return () => {
            socket.off('whiteboard-draw', handler);
            socket.off('whiteboard-clear');
        };
    }, [socket]);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches?.[0];
        return {
            x: (touch ? touch.clientX : e.clientX) - rect.left,
            y: (touch ? touch.clientY : e.clientY) - rect.top,
        };
    };

    const startDraw = (e) => {
        setDrawing(true);
        lastPos.current = getPos(e, canvasRef.current);
    };

    const draw = (e) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e, canvas);
        const activeColor = mode === 'eraser' ? '#1a1a2e' : color;
        const activeSize = mode === 'eraser' ? brushSize * 4 : brushSize;

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = activeSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        socket?.emit('whiteboard-draw', {
            roomId,
            data: { x1: lastPos.current.x, y1: lastPos.current.y, x2: pos.x, y2: pos.y, color: activeColor, size: activeSize },
        });

        lastPos.current = pos;
    };

    const endDraw = () => setDrawing(false);

    const clearBoard = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        socket?.emit('whiteboard-clear', { roomId });
    };

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Whiteboard</span>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-3 p-3 border-b flex-wrap" style={{ borderColor: 'var(--border-color)' }}>
                {COLORS.map(c => (
                    <button key={c} onClick={() => { setColor(c); setMode('pen'); }}
                        className="w-6 h-6 rounded-full transition-all hover:scale-125"
                        style={{ background: c, border: color === c && mode === 'pen' ? '2px solid white' : '2px solid transparent', outline: color === c && mode === 'pen' ? '2px solid #6366f1' : 'none' }} />
                ))}
                <div className="w-px h-6 bg-white/10" />
                <button onClick={() => setMode('eraser')}
                    className={`px-2 py-1 text-xs rounded-lg transition-all ${mode === 'eraser' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                    🧹 Eraser
                </button>
                <input type="range" min={2} max={20} value={brushSize} onChange={e => setBrushSize(+e.target.value)}
                    className="w-20 accent-indigo-500" />
                <button onClick={clearBoard} className="ml-auto px-3 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    🗑️ Clear
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ cursor: mode === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                />
            </div>
        </div>
    );
}
