import React, { useRef, useEffect, useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────────
   Avatar Placeholder
───────────────────────────────────────────────────────────────── */
function Avatar({ name, fontSize }) {
    const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const hue = ((name?.charCodeAt(0) || 65) * 47) % 360;
    return (
        <div
            className="w-full h-full flex items-center justify-center font-bold text-white select-none absolute inset-0"
            style={{ background: `hsl(${hue},45%,28%)`, fontSize: fontSize || 'clamp(1.2rem,3vw,3rem)' }}
        >
            {initials}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   Single Video Tile — fills its CSS grid cell 100%
───────────────────────────────────────────────────────────────── */
function VideoTile({ stream, name, muted, videoOff, speaking, isLocal, isScreenShare, onPin, isPinned, size }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream || null;
    }, [stream]);

    const fontSize = size === 'lg' ? 'clamp(2.5rem,7vw,6rem)' : 'clamp(1rem,2.5vw,2.5rem)';

    return (
        <div
            className="relative w-full h-full overflow-hidden group"
            style={{
                borderRadius: 8,
                outline: speaking ? '2.5px solid #2D8CFF' : '2px solid rgba(255,255,255,0.06)',
                boxShadow: speaking ? '0 0 0 4px rgba(45,140,255,0.18)' : 'none',
                transition: 'outline 0.2s, box-shadow 0.2s',
                background: '#1a1a1a',
            }}
        >
            {/* Video element — always rendered, hidden when videoOff */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: stream && !videoOff ? 'block' : 'none' }}
            />

            {/* Avatar — shown when no stream or video is off */}
            {(!stream || videoOff) && <Avatar name={name} fontSize={fontSize} />}

            {/* Speaking animated ring */}
            {speaking && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{ animation: 'speakerPulse 1.4s ease-out infinite', borderRadius: 8 }}
                />
            )}

            {/* Bottom gradient + name bar */}
            <div
                className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 py-1.5 pointer-events-none"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {speaking && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#2D8CFF' }} />
                    )}
                    <span className="text-white text-xs font-medium truncate">
                        {isScreenShare ? '🖥 Screen' : name}{isLocal ? ' (You)' : ''}
                    </span>
                    {muted && (
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5}>
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path strokeLinecap="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
                        </svg>
                    )}
                </div>

                {/* Pin button — visible on hover */}
                {onPin && (
                    <button
                        onClick={onPin}
                        className="pointer-events-auto w-6 h-6 rounded flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                        style={{ background: isPinned ? '#2D8CFF' : 'rgba(255,255,255,0.18)' }}
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   Thumbnail strip tile (Speaker view)
───────────────────────────────────────────────────────────────── */
function ThumbTile({ stream, name, muted, videoOff, speaking, isLocal, isScreenShare, onClick }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream || null;
    }, [stream]);

    return (
        <div
            onClick={onClick}
            className="relative flex-shrink-0 cursor-pointer overflow-hidden group"
            style={{
                width: 130, height: 98, borderRadius: 6,
                outline: speaking ? '2px solid #2D8CFF' : '2px solid rgba(255,255,255,0.1)',
                background: '#1a1a1a',
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: stream && !videoOff ? 'block' : 'none' }}
            />
            {(!stream || videoOff) && <Avatar name={name} fontSize="1rem" />}

            {/* name */}
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                style={{ background: 'rgba(0,0,0,0.65)' }}>
                <p className="text-white text-[10px] truncate">
                    {isScreenShare ? '🖥 Screen' : name}{isLocal ? ' (You)' : ''}
                </p>
            </div>

            {speaking && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: '#2D8CFF' }} />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   Grid layout calculator — returns { cols, rows }
   Tries to find the most "square" arrangement that fits the space
───────────────────────────────────────────────────────────────── */
function calcGrid(count, containerW, containerH) {
    if (count === 0) return { cols: 1, rows: 1 };
    if (count === 1) return { cols: 1, rows: 1 };

    // Try all possible column counts and pick the one where
    // tile aspect ratio is closest to 16/9
    const gap = 6;
    let bestCols = 1;
    let bestScore = Infinity;

    for (let cols = 1; cols <= count; cols++) {
        const rows = Math.ceil(count / cols);
        const tileW = (containerW - gap * (cols - 1)) / cols;
        const tileH = (containerH - gap * (rows - 1)) / rows;
        const ratio = tileW / tileH;
        // Score: how far from 16/9
        const score = Math.abs(ratio - 16 / 9);
        if (score < bestScore) {
            bestScore = score;
            bestCols = cols;
        }
    }

    const bestRows = Math.ceil(count / bestCols);
    return { cols: bestCols, rows: bestRows };
}

/* ─────────────────────────────────────────────────────────────────
   Main VideoGrid Component
   Props:
     localStream, remotePeers, localUser, speakerId
     viewMode:   'gallery' | 'speaker'
     pinnedId:   string | null
     onPinChange: (id | null) => void
───────────────────────────────────────────────────────────────── */
export default function VideoGrid({
    localStream,
    remotePeers,
    localUser,
    speakerId,
    viewMode = 'gallery',
    pinnedId,
    onPinChange,
}) {
    /* ── Container size tracking ────────────────────────────── */
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = React.useState({ w: 800, h: 600 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ w: width, h: height });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /* ── Participant list ───────────────────────────────────── */
    const all = useMemo(() => [
        {
            id: 'local',
            stream: localStream,
            name: localUser?.name || 'You',
            muted: localUser?.muted ?? false,
            videoOff: localUser?.videoOff ?? false,
            isLocal: true,
        },
        ...remotePeers.map(p => ({ ...p, isLocal: false })),
    ], [localStream, localUser, remotePeers]);

    const count = all.length;

    /* ── Pin handler ────────────────────────────────────────── */
    const handlePin = (id) => onPinChange?.(pinnedId === id ? null : id);

    /* ── Speaker view ───────────────────────────────────────── */
    if (viewMode === 'speaker' && count > 1) {
        const focusId = pinnedId || speakerId || all[0].id;
        const focusPeer = all.find(p => p.id === focusId) || all[0];
        const thumbs = all.filter(p => p.id !== focusPeer?.id);

        return (
            <div className="w-full h-full flex flex-col" style={{ gap: 6, padding: 6 }}>
                {/* Main speaker */}
                <div className="flex-1 min-h-0">
                    {focusPeer && (
                        <VideoTile
                            stream={focusPeer.stream}
                            name={focusPeer.name}
                            muted={focusPeer.muted}
                            videoOff={focusPeer.videoOff}
                            speaking={speakerId === focusPeer.id}
                            isLocal={focusPeer.isLocal}
                            isScreenShare={focusPeer.isScreenShare}
                            size="lg"
                            isPinned={pinnedId === focusPeer.id}
                            onPin={onPinChange ? () => handlePin(focusPeer.id) : null}
                        />
                    )}
                </div>

                {/* Thumbnail strip */}
                {thumbs.length > 0 && (
                    <div className="flex gap-1.5 flex-shrink-0 overflow-x-auto pb-0.5 thumb-strip">
                        {thumbs.map(peer => (
                            <ThumbTile
                                key={peer.id}
                                stream={peer.stream}
                                name={peer.name}
                                muted={peer.muted}
                                videoOff={peer.videoOff}
                                speaking={speakerId === peer.id}
                                isLocal={peer.isLocal}
                                isScreenShare={peer.isScreenShare}
                                onClick={() => handlePin(peer.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    /* ── Gallery view — advanced grid layout ─────────────────── */
    const { cols, rows } = calcGrid(count, containerSize.w, containerSize.h);
    const gap = 6;

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ padding: gap }}
        >
            <div
                style={{
                    display: 'grid',
                    width: '100%',
                    height: '100%',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: gap,
                }}
            >
                {all.map(peer => (
                    <div key={peer.id} className="min-w-0 min-h-0 group">
                        <VideoTile
                            stream={peer.stream}
                            name={peer.name}
                            muted={peer.muted}
                            videoOff={peer.videoOff}
                            speaking={speakerId === peer.id}
                            isLocal={peer.isLocal}
                            isScreenShare={peer.isScreenShare}
                            size="md"
                            isPinned={pinnedId === peer.id}
                            onPin={onPinChange ? () => handlePin(peer.id) : null}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
