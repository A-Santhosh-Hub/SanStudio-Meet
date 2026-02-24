import React, { useRef, useEffect } from 'react';

function AvatarPlaceholder({ name }) {
    const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const colors = [
        'from-indigo-600 to-purple-700',
        'from-blue-600 to-indigo-700',
        'from-violet-600 to-indigo-700',
        'from-purple-600 to-pink-700',
        'from-sky-600 to-blue-700',
        'from-teal-600 to-cyan-700',
    ];
    const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
    return (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color} text-white font-bold select-none`}
            style={{ fontSize: 'clamp(1.2rem, 4vw, 2.5rem)' }}>
            {initials}
        </div>
    );
}

function VideoTile({ stream, name, muted, videoOff, speaking, isLocal, isScreenShare }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`video-tile w-full ${speaking ? 'speaking' : ''}`} style={{ aspectRatio: '16/9' }}>
            {stream && !videoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <AvatarPlaceholder name={name} />
            )}

            {/* Name Badge */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium truncate max-w-[120px]">
                    {isScreenShare ? '🖥️ Screen' : name}{isLocal ? ' (You)' : ''}
                </span>
                {muted && (
                    <span className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </span>
                )}
            </div>

            {/* Speaking indicator ring */}
            {speaking && (
                <div className="absolute inset-0 rounded-[10px] border-2 border-indigo-400 pointer-events-none" />
            )}

            {/* Video off overlay */}
            {videoOff && stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <AvatarPlaceholder name={name} />
                </div>
            )}
        </div>
    );
}

export default function VideoGrid({ localStream, remotePeers, localUser, speakerId }) {
    const all = [
        { id: 'local', stream: localStream, name: localUser?.name || 'You', muted: localUser?.muted, videoOff: localUser?.videoOff, isLocal: true },
        ...remotePeers.map(p => ({ ...p, isLocal: false })),
    ].filter(Boolean);

    const count = all.length;
    const gridClass =
        count === 1 ? 'grid-1' :
            count === 2 ? 'grid-2' :
                count <= 4 ? 'grid-4' :
                    count <= 6 ? 'grid-6' : 'grid-9';

    return (
        <div className={`video-grid ${gridClass} w-full h-full p-2`}>
            {all.map((peer) => (
                <VideoTile
                    key={peer.id}
                    stream={peer.stream}
                    name={peer.name}
                    muted={peer.muted}
                    videoOff={peer.videoOff}
                    speaking={speakerId === peer.id}
                    isLocal={peer.isLocal}
                    isScreenShare={peer.isScreenShare}
                />
            ))}
        </div>
    );
}
