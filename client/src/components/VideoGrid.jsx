import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ─── Avatar placeholder ─────────────────────────────────────────── */
function Avatar({ name, size = 'md' }) {
    const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const hue = (name?.charCodeAt(0) || 65) * 47 % 360;
    const fontSize = size === 'lg' ? 'clamp(2rem,6vw,5rem)' : size === 'sm' ? '0.9rem' : 'clamp(1.2rem,3vw,2.5rem)';
    return (
        <div className="w-full h-full flex items-center justify-center font-bold text-white select-none"
            style={{ background: `hsl(${hue},50%,30%)`, fontSize }}>
            {initials}
        </div>
    );
}

/* ─── Single video tile ──────────────────────────────────────────── */
function VideoTile({ stream, name, muted, videoOff, speaking, isLocal, isScreenShare, size = 'md', onPin, isPinned }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (stream) {
            if (v.srcObject !== stream) v.srcObject = stream;
        } else {
            v.srcObject = null;
        }
    }, [stream]);

    return (
        <div
            className="video-tile w-full relative overflow-hidden"
            style={{
                aspectRatio: '16/9',
                borderRadius: 8,
                outline: speaking ? '2px solid #2D8CFF' : '2px solid transparent',
                boxShadow: speaking ? '0 0 0 3px rgba(45,140,255,0.25)' : 'none',
                transition: 'outline 0.2s ease, box-shadow 0.2s ease',
            }}>

            {/* Video or Avatar */}
            {stream && !videoOff ? (
                <video ref={videoRef} autoPlay playsInline muted={isLocal}
                    className="w-full h-full object-cover" />
            ) : (
                <Avatar name={name} size={size} />
            )}

            {/* Video-off overlay when stream exists but cam off */}
            {videoOff && stream && (
                <div className="absolute inset-0"><Avatar name={name} size={size} /></div>
            )}

            {/* Speaking pulse ring */}
            {speaking && (
                <div className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{ border: '2px solid #2D8CFF', animation: 'speakerPulse 1.5s ease-out infinite' }} />
            )}

            {/* Bottom bar: name + mute + pin */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 py-1.5 pointer-events-none"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }}>
                <div className="flex items-center gap-1.5">
                    {/* Speaking dot */}
                    {speaking && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#2D8CFF' }} />
                    )}
                    <span className="text-white text-xs font-medium truncate max-w-[110px]">
                        {isScreenShare ? '🖥 Screen' : name}{isLocal ? ' (You)' : ''}
                    </span>
                    {muted && (
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2}>
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
                {/* Pin button */}
                {onPin && (
                    <button onClick={onPin}
                        className="pointer-events-auto w-6 h-6 rounded flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                        style={{ background: isPinned ? '#2D8CFF' : 'rgba(255,255,255,0.2)' }}
                        title={isPinned ? 'Unpin' : 'Pin'}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── Thumbnail strip item ───────────────────────────────────────── */
function ThumbTile({ stream, name, muted, videoOff, speaking, isLocal, isScreenShare, onPin, isPinned, onClick }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (stream && !videoOff) v.srcObject = stream;
        else v.srcObject = null;
    }, [stream, videoOff]);

    return (
        <div onClick={onClick}
            className="flex-shrink-0 relative cursor-pointer group"
            style={{
                width: 120, height: 90, borderRadius: 6,
                outline: speaking ? '2px solid #2D8CFF' : '2px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                flexShrink: 0,
            }}>
            {stream && !videoOff ? (
                <video ref={videoRef} autoPlay playsInline muted={isLocal}
                    className="w-full h-full object-cover" />
            ) : (
                <Avatar name={name} size="sm" />
            )}
            {videoOff && stream && (
                <div className="absolute inset-0"><Avatar name={name} size="sm" /></div>
            )}
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <p className="text-white text-[10px] truncate">
                    {isScreenShare ? '🖥 Screen' : name}{isLocal ? ' (You)' : ''}
                </p>
            </div>
            {/* Speaking dot */}
            {speaking && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400" />
            )}
        </div>
    );
}

/* ─── Main VideoGrid component ───────────────────────────────────── */
/**
 * Props:
 *  localStream  – local MediaStream
 *  remotePeers  – [{ id, stream, name, muted, videoOff, isScreenShare }]
 *  localUser    – { id, name, muted, videoOff }
 *  speakerId    – currently detected active speaker id ('local' or peer socket id)
 *  viewMode     – 'speaker' | 'gallery'
 *  pinnedId     – id of pinned tile (overrides speaker focus)
 *  onPinChange  – (id | null) => void
 */
export default function VideoGrid({
    localStream,
    remotePeers,
    localUser,
    speakerId,
    viewMode = 'gallery',
    pinnedId,
    onPinChange,
}) {
    const all = [
        { id: 'local', stream: localStream, name: localUser?.name || 'You', muted: localUser?.muted, videoOff: localUser?.videoOff, isLocal: true },
        ...remotePeers.map(p => ({ ...p, isLocal: false })),
    ].filter(Boolean);

    const count = all.length;

    /* ── Gallery view: auto-fit grid ─────────────────────────── */
    const galleryColumns =
        count === 1 ? '1fr' :
            count === 2 ? '1fr 1fr' :
                count <= 4 ? 'repeat(2, 1fr)' :
                    count <= 9 ? 'repeat(3, 1fr)' :
                        count <= 16 ? 'repeat(4, 1fr)' :
                            'repeat(4, 1fr)'; // 17+: paginate (future)

    /* ── Speaker / Pin view ──────────────────────────────────── */
    const focusId = pinnedId || speakerId || (count > 0 ? all[0].id : null);
    const focusPeer = all.find(p => p.id === focusId) || all[0];
    const thumbnails = all.filter(p => p.id !== focusPeer?.id);
    const isSpeakerView = viewMode === 'speaker' && count > 1;

    const handlePin = (id) => {
        onPinChange?.(pinnedId === id ? null : id);
    };

    /* ── Gallery layout ──────────────────────────────────────── */
    if (!isSpeakerView) {
        return (
            <div className="w-full h-full p-2" style={{ overflowY: 'hidden' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: galleryColumns,
                    gap: 6,
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyItems: 'center',
                }}>
                    {all.map(peer => (
                        <div key={peer.id} className="group w-full">
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

    /* ── Speaker layout ──────────────────────────────────────── */
    return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ gap: 6, padding: 8 }}>

            {/* Large focus tile */}
            <div className="flex-1 min-h-0 group" style={{ transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
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
            {thumbnails.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto flex-shrink-0 pb-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}>
                    {thumbnails.map(peer => (
                        <ThumbTile
                            key={peer.id}
                            stream={peer.stream}
                            name={peer.name}
                            muted={peer.muted}
                            videoOff={peer.videoOff}
                            speaking={speakerId === peer.id}
                            isLocal={peer.isLocal}
                            isScreenShare={peer.isScreenShare}
                            isPinned={pinnedId === peer.id}
                            onPin={onPinChange ? () => handlePin(peer.id) : null}
                            onClick={() => handlePin(peer.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
