import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useAuth, ROLE_COLORS } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import ControlsBar from '../components/ControlsBar';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import WaitingRoom from '../components/WaitingRoom';
import SettingsPanel from '../components/SettingsPanel';
import WhiteboardPanel from '../components/WhiteboardPanel';
import NotesPanel from '../components/NotesPanel';
import Toast from '../components/Toast';

export default function MeetingRoom() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    // Prefer display name from auth, fallback to query param
    const userName = user?.displayName || user?.username || searchParams.get('name') || 'Guest';
    const userRole = user?.role || 'user';
    const isHostParam = searchParams.get('host') === 'true';
    const password = searchParams.get('password') || '';

    // ── State ────────────────────────────────────────────────
    const [participants, setParticipants] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isHost, setIsHost] = useState(isHostParam);
    const [waiting, setWaiting] = useState(false);
    const [waitingUsers, setWaitingUsers] = useState([]);

    const [chatOpen, setChatOpen] = useState(false);
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [messages, setMessages] = useState([]);
    const [unreadChat, setUnreadChat] = useState(0);
    const [reactions, setReactions] = useState([]);
    const [toasts, setToasts] = useState([]);

    const [audioEnabled, setAudioEnabled] = useState(userRole !== 'student');
    const [videoEnabled, setVideoEnabled] = useState(userRole !== 'student');
    const [screenSharing, setScreenSharing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [roomLocked, setRoomLocked] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const localIdRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordChunks = useRef([]);
    const screenStreamRef = useRef(null);
    const hasJoinedRef = useRef(false); // prevent double-join
    const [controlMode, setControlMode] = useState('lecture');
    const [canSpeak, setCanSpeak] = useState(false); // Temporarily allowed by coach

    // ── Hooks ────────────────────────────────────────────────
    const { socketRef } = useSocket();
    const {
        stream: localStream,
        streamRef,
        devices,
        getMedia,
        toggleAudio: _toggleAudio,
        toggleVideo: _toggleVideo,
        switchDevice,
        getScreenShare,
        stopAll,
    } = useMediaDevices();

    const handleRemoteStream = useCallback((peerId, stream) => {
        setRemoteStreams(prev => ({ ...prev, [peerId]: { ...prev[peerId], stream } }));
    }, []);

    const handleRemoveStream = useCallback((peerId) => {
        setRemoteStreams(prev => { const n = { ...prev }; delete n[peerId]; return n; });
    }, []);

    const { setLocalStream, createPeer, handleOffer, handleAnswer, handleIceCandidate, replaceTrack, removePeer, closeAll } = useWebRTC({
        onRemoteStream: handleRemoteStream,
        onRemoveStream: handleRemoveStream,
        socketRef,
        roomId,
    });

    // ── Toast ────────────────────────────────────────────────
    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(t => [...t, { id, message, type, duration }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration + 500);
    }, []);

    // ── Timer ────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setElapsedTime(s => s + 1), 1000);
        return () => clearInterval(t);
    }, []);

    // ── Init media ───────────────────────────────────────────
    useEffect(() => {
        getMedia().then(s => setLocalStream(s)).catch(() => { });
        return () => { stopAll(); closeAll(); };
        // eslint-disable-next-line
    }, []);

    // ── Socket setup — runs ONCE, joins after connect ────────
    useEffect(() => {
        // Poll until socket is created by useSocket's own effect
        const trySetup = () => {
            const socket = socketRef.current;
            if (!socket) {
                setTimeout(trySetup, 50);
                return;
            }
            setupSocket(socket);
        };
        trySetup();
        // eslint-disable-next-line
    }, []);

    const setupSocket = useCallback((socket) => {
        // ── Emit join-room exactly ONCE after connection ──────
        const doJoin = () => {
            if (hasJoinedRef.current) return;
            hasJoinedRef.current = true;
            localIdRef.current = socket.id;
            socket.emit('join-room', {
                roomId,
                name: userName,
                password,
                isHost: isHostParam || userRole === 'admin' || userRole === 'coach' || userRole === 'pm',
                role: userRole,
            });
        };

        if (socket.connected) {
            doJoin();
        } else {
            socket.once('connect', doJoin);
        }

        // ── Register event handlers ───────────────────────────
        const onJoined = ({ participants: peers, isHost: host, controlMode: mode }) => {
            setIsHost(host);
            setParticipants(peers);
            if (mode) setControlMode(mode);
            localIdRef.current = socket.id;
            peers.forEach(p => {
                if (p.id !== socket.id) createPeer(p.id, true);
            });
        };

        const onWaitingRoom = () => setWaiting(true);

        const onAdmitted = ({ participants: peers }) => {
            setWaiting(false);
            setParticipants(peers);
            peers.forEach(p => {
                if (p.id !== socket.id) createPeer(p.id, true);
            });
            addToast('You have been admitted to the meeting', 'success');
        };

        const onDenied = ({ message }) => {
            addToast(message, 'error', 5000);
            setTimeout(() => navigate('/'), 3000);
        };

        const onWaitingUser = (user) => {
            setWaitingUsers(w => [...w.filter(u => u.id !== user.id), user]);
            addToast(`${user.name} wants to join`, 'info', 8000);
        };

        const onUserJoined = (participant) => {
            setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
            setRemoteStreams(prev => ({ ...prev, [participant.id]: { name: participant.name } }));
            createPeer(participant.id, false);
            addToast(`${participant.name} joined`, 'info');
        };

        const onUserLeft = ({ id }) => {
            setParticipants(prev => prev.filter(p => p.id !== id));
            removePeer(id);
        };

        const onChatMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
            setChatOpen(prev => { if (!prev) setUnreadChat(n => n + 1); return prev; });
        };

        const onFileShare = (msg) => {
            setMessages(prev => [...prev, { ...msg, type: 'file', id: Date.now() }]);
            setUnreadChat(n => n + 1);
            addToast(`${msg.sender} shared: ${msg.fileName}`, 'info');
        };

        const onParticipantUpdated = ({ id, ...updates }) => {
            setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            setRemoteStreams(prev => prev[id] ? { ...prev, [id]: { ...prev[id], ...updates } } : prev);
        };

        const onForceMute = () => {
            _toggleAudio();
            setAudioEnabled(false);
            addToast('Host muted your microphone', 'warning');
        };

        const onKicked = ({ message }) => {
            addToast(message, 'error', 5000);
            setTimeout(() => navigate('/'), 2000);
        };

        const onRoomLocked = ({ locked }) => {
            setRoomLocked(locked);
            addToast(locked ? '🔒 Room locked' : '🔓 Room unlocked', 'info');
        };

        const onHandRaised = ({ id, name, raised }) => {
            setParticipants(prev => prev.map(p => p.id === id ? { ...p, handRaised: raised } : p));
            if (raised && id !== socket.id) addToast(`${name} raised their hand ✋`, 'info');
        };

        const onReaction = ({ emoji }) => {
            const key = Date.now() + Math.random();
            setReactions(prev => [...prev, { emoji, key }]);
            setTimeout(() => setReactions(prev => prev.filter(r => r.key !== key)), 3000);
        };

        const onHostTransferred = () => {
            setIsHost(true);
            addToast('You are now the host', 'success');
        };

        const onSpeakAllowed = () => {
            setCanSpeak(true);
            addToast('You have been permitted to speak by the Host', 'success');
        };

        const onSpeakRevoked = () => {
            setCanSpeak(false);
            setAudioEnabled(false);
            addToast('Your permission to speak has been revoked', 'warning');
        };

        const onModeChanged = ({ mode }) => {
            setControlMode(mode);
            addToast(`Meeting changed to ${mode} mode`, 'info');
            if (mode === 'lecture') {
                setCanSpeak(false);
            }
        };

        const onError = ({ message }) => addToast(message, 'error', 5000);
        const onPasswordRequired = () => { addToast('Meeting requires a password', 'warning'); navigate(-1); };
        const onPMEntered = ({ name: pmName }) => addToast(`⭐ ${pmName} (PM Sir) has entered the meeting`, 'info', 5000);

        socket.on('joined-room', onJoined);
        socket.on('waiting-room', onWaitingRoom);
        socket.on('admitted', onAdmitted);
        socket.on('denied', onDenied);
        socket.on('waiting-user', onWaitingUser);
        socket.on('user-joined', onUserJoined);
        socket.on('user-left', onUserLeft);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('chat-message', onChatMessage);
        socket.on('file-share', onFileShare);
        socket.on('participant-updated', onParticipantUpdated);
        socket.on('force-mute', onForceMute);
        socket.on('all-muted', () => addToast('Host muted all participants', 'warning'));
        socket.on('kicked', onKicked);
        socket.on('room-locked', onRoomLocked);
        socket.on('hand-raised', onHandRaised);
        socket.on('reaction', onReaction);
        socket.on('host-transferred', onHostTransferred);
        socket.on('speak-allowed', onSpeakAllowed);
        socket.on('speak-revoked', onSpeakRevoked);
        socket.on('mode-changed', onModeChanged);
        socket.on('error', onError);
        socket.on('password-required', onPasswordRequired);
        socket.on('pm-entered', onPMEntered);

        return () => {
            socket.off('joined-room', onJoined);
            socket.off('waiting-room', onWaitingRoom);
            socket.off('admitted', onAdmitted);
            socket.off('denied', onDenied);
            socket.off('waiting-user', onWaitingUser);
            socket.off('user-joined', onUserJoined);
            socket.off('user-left', onUserLeft);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('chat-message', onChatMessage);
            socket.off('file-share', onFileShare);
            socket.off('participant-updated', onParticipantUpdated);
            socket.off('force-mute', onForceMute);
            socket.off('kicked', onKicked);
            socket.off('room-locked', onRoomLocked);
            socket.off('hand-raised', onHandRaised);
            socket.off('reaction', onReaction);
            socket.off('host-transferred', onHostTransferred);
            socket.off('speak-allowed', onSpeakAllowed);
            socket.off('speak-revoked', onSpeakRevoked);
            socket.off('mode-changed', onModeChanged);
            socket.off('error', onError);
            socket.off('password-required', onPasswordRequired);
            socket.off('pm-entered', onPMEntered);
        };
    }, []);  // ← EMPTY DEPS: run exactly once

    // ── Controls ─────────────────────────────────────────────
    const handleToggleAudio = useCallback(() => {
        if (userRole === 'student' && controlMode === 'lecture' && !canSpeak && !audioEnabled) {
            addToast('You are muted by the host in lecture mode.', 'error');
            return;
        }
        if (userRole === 'student' && controlMode === 'interactive' && !canSpeak && !audioEnabled) {
            addToast('You must raise your hand and be permitted to speak.', 'error');
            return;
        }

        _toggleAudio();
        setAudioEnabled(prev => {
            const next = !prev;
            socketRef.current?.emit('update-status', { roomId, muted: !next, videoOff: !videoEnabled });
            return next;
        });
    }, [_toggleAudio, videoEnabled, roomId, socketRef, userRole, controlMode, canSpeak, audioEnabled, addToast]);

    const handleToggleVideo = useCallback(() => {
        if (userRole === 'student' && controlMode === 'lecture' && !canSpeak && !videoEnabled) {
            addToast('You cannot turn on your camera in lecture mode.', 'error');
            return;
        }

        _toggleVideo();
        setVideoEnabled(prev => {
            const next = !prev;
            socketRef.current?.emit('update-status', { roomId, muted: !audioEnabled, videoOff: !next });
            return next;
        });
    }, [_toggleVideo, audioEnabled, roomId, socketRef, userRole, controlMode, canSpeak, videoEnabled, addToast]);

    const handleScreenShare = useCallback(async () => {
        if (userRole === 'student' && !canSpeak && controlMode !== 'open') {
            addToast('You need permission to share your screen.', 'error');
            return;
        }
        if (screenSharing) {
            // Stop screen sharing
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            setScreenSharing(false);
            // Revert to camera track on all peer connections
            const cameraTrack = streamRef.current?.getVideoTracks()[0];
            if (cameraTrack) replaceTrack(cameraTrack, 'video');
            addToast('Screen sharing stopped', 'info');
            return;
        }
        const screenStream = await getScreenShare();
        if (!screenStream) return;
        screenStreamRef.current = screenStream;
        setScreenSharing(true);
        // Push the screen track to all existing peer connections
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) replaceTrack(screenTrack, 'video');
        // When the user stops sharing via browser's own button
        screenTrack.onended = () => {
            screenStreamRef.current = null;
            setScreenSharing(false);
            const cameraTrack = streamRef.current?.getVideoTracks()[0];
            if (cameraTrack) replaceTrack(cameraTrack, 'video');
            addToast('Screen sharing stopped', 'info');
        };
        addToast('Screen sharing started', 'success');
    }, [screenSharing, getScreenShare, replaceTrack, streamRef, addToast]);

    const handleChat = (message) => {
        socketRef.current?.emit('chat-message', { roomId, message, type: 'text' });
    };

    const handleFileShare = ({ fileName, fileType, fileData }) => {
        socketRef.current?.emit('file-share', { roomId, fileName, fileType, fileData });
    };

    const handleRaiseHand = () => {
        setHandRaised(prev => {
            socketRef.current?.emit('raise-hand', { roomId, raised: !prev });
            return !prev;
        });
    };

    const handleReaction = (emoji) => socketRef.current?.emit('reaction', { roomId, emoji });
    const handleMuteUser = (id) => socketRef.current?.emit('mute-user', { targetId: id, roomId });
    const handleKick = (id) => socketRef.current?.emit('kick-user', { targetId: id, roomId });
    const handleMuteAll = () => socketRef.current?.emit('mute-all', { roomId });
    const handleLock = () => socketRef.current?.emit('lock-room', { roomId, locked: !roomLocked });

    const handleAdmit = (userId) => {
        socketRef.current?.emit('admit-user', { userId, roomId });
        setWaitingUsers(w => w.filter(u => u.id !== userId));
    };
    const handleDeny = (userId) => {
        socketRef.current?.emit('deny-user', { userId, roomId });
        setWaitingUsers(w => w.filter(u => u.id !== userId));
    };

    // ── Recording ─────────────────────────────────────────────
    const handleRecord = useCallback(() => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            setRecording(false);
            return;
        }
        const stream = streamRef.current;
        if (!stream) { addToast('No media stream to record', 'error'); return; }
        try {
            const rec = new MediaRecorder(stream, { mimeType: 'video/mp4' });
            recordChunks.current = [];
            rec.ondataavailable = e => { if (e.data.size > 0) recordChunks.current.push(e.data); };
            rec.onstop = () => {
                const blob = new Blob(recordChunks.current, { type: 'video/mp4' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `recording-${roomId}.mp4`;
                a.click();
                addToast('Recording saved!', 'success');
            };
            rec.start();
            mediaRecorderRef.current = rec;
            setRecording(true);
            addToast('Recording started 🔴', 'warning');
        } catch (e) {
            addToast('Recording not supported in this browser', 'error');
        }
    }, [recording, streamRef, roomId, addToast]);

    const handleEndMeeting = useCallback(() => {
        if (recording) mediaRecorderRef.current?.stop();
        stopAll();
        closeAll();
        socketRef.current?.disconnect();
        navigate('/');
    }, [recording, stopAll, closeAll, navigate, socketRef]);

    // ── Unread chat reset ─────────────────────────────────────
    useEffect(() => { if (chatOpen) setUnreadChat(0); }, [chatOpen]);

    // ── Derived ───────────────────────────────────────────────
    const remotePeers = Object.entries(remoteStreams).map(([id, data]) => ({
        id,
        stream: data.stream,
        name: data.name || participants.find(p => p.id === id)?.name || 'Unknown',
        muted: participants.find(p => p.id === id)?.muted || false,
        videoOff: participants.find(p => p.id === id)?.videoOff || false,
        isScreenShare: data.isScreenShare,
    }));

    const localUser = { id: localIdRef.current, name: userName, muted: !audioEnabled, videoOff: !videoEnabled };
    const activePanel = chatOpen ? 'chat' : participantsOpen ? 'participants' : whiteboardOpen ? 'whiteboard' : notesOpen ? 'notes' : null;

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>

            {/* Guest waiting screen */}
            {waiting && <WaitingRoom isHost={false} waitingUsers={[]} onAdmit={() => { }} onDeny={() => { }} />}

            {/* Host admission panel */}
            {isHost && waitingUsers.length > 0 && (
                <WaitingRoom isHost={true} waitingUsers={waitingUsers} onAdmit={handleAdmit} onDeny={handleDeny} />
            )}

            {settingsOpen && (
                <SettingsPanel devices={devices} onDeviceChange={(id, kind) => switchDevice(id, kind)} onClose={() => setSettingsOpen(false)} />
            )}

            {/* Floating reactions */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {reactions.map(r => (
                    <div key={r.key} className="reaction-emoji" style={{ left: `${20 + Math.random() * 60}%` }}>{r.emoji}</div>
                ))}
            </div>

            <Toast toasts={toasts} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
                style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                            <rect x="2" y="7" width="9" height="9" rx="2" fill="white" />
                            <path d="M13 9.5L21 6v12l-8-3.5V9.5z" fill="white" />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--text-primary)' }}>SanStudio Meet</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {roomId}
                    </span>
                    {isHost && <span className="px-2 py-0.5 text-xs bg-yellow-500/15 text-yellow-500 rounded-full font-semibold">HOST</span>}
                    {/* Role badge from auth */}
                    {userRole && userRole !== 'user' && (() => {
                        const rc = ROLE_COLORS[userRole];
                        return rc ? (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border hidden sm:inline-flex ${rc.bg} ${rc.text} ${rc.border}`}>
                                {rc.label}
                            </span>
                        ) : null;
                    })()}
                    <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`); addToast('Meeting link copied!', 'success'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        🔗 Copy link
                    </button>
                    {/* Show waiting count badge for host */}
                    {isHost && waitingUsers.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full font-bold animate-pulse">
                            ⏳ {waitingUsers.length} waiting
                        </span>
                    )}
                </div>
                <a href="https://sanstudio.neocities.org/" target="_blank" rel="noopener noreferrer"
                    className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    by <span className="text-indigo-500 font-semibold">SanStudio</span>
                </a>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden p-2 join-animate">
                    <VideoGrid
                        localStream={screenSharing ? (screenStreamRef.current || localStream) : localStream}
                        remotePeers={remotePeers}
                        localUser={localUser}
                        speakerId={null}
                    />
                </div>

                {activePanel && (
                    <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden animate-slide-in-right border-l"
                        style={{ borderColor: 'var(--border-color)' }}>
                        {chatOpen && <ChatPanel messages={messages} onSend={handleChat} onFileShare={handleFileShare} onClose={() => setChatOpen(false)} />}
                        {participantsOpen && <ParticipantsPanel participants={participants} localId={localIdRef.current} isHost={isHost} onKick={handleKick} onMuteUser={handleMuteUser} onMuteAll={handleMuteAll} onClose={() => setParticipantsOpen(false)} socket={socketRef.current} roomId={roomId} />}
                        {whiteboardOpen && <WhiteboardPanel socket={socketRef.current} roomId={roomId} onClose={() => setWhiteboardOpen(false)} />}
                        {notesOpen && <NotesPanel roomId={roomId} onClose={() => setNotesOpen(false)} />}
                    </div>
                )}
            </div>

            <ControlsBar
                audioEnabled={audioEnabled} videoEnabled={videoEnabled}
                screenSharing={screenSharing} recording={recording}
                isHost={isHost} roomLocked={roomLocked} handRaised={handRaised}
                userRole={userRole} controlMode={controlMode}
                canSpeak={canSpeak}
                chatOpen={chatOpen} participantsOpen={participantsOpen}
                whiteboardOpen={whiteboardOpen} notesOpen={notesOpen}
                elapsedTime={elapsedTime} unreadChat={unreadChat}
                onToggleAudio={handleToggleAudio} onToggleVideo={handleToggleVideo}
                onToggleScreen={handleScreenShare}
                onToggleChat={() => { setChatOpen(s => !s); setParticipantsOpen(false); setWhiteboardOpen(false); setNotesOpen(false); }}
                onToggleParticipants={() => { setParticipantsOpen(s => !s); setChatOpen(false); setWhiteboardOpen(false); setNotesOpen(false); }}
                onToggleWhiteboard={() => { setWhiteboardOpen(s => !s); setChatOpen(false); setParticipantsOpen(false); setNotesOpen(false); }}
                onToggleNotes={() => { setNotesOpen(s => !s); setChatOpen(false); setParticipantsOpen(false); setWhiteboardOpen(false); }}
                onReaction={handleReaction} onRaiseHand={handleRaiseHand}
                onRecord={handleRecord} onToggleLock={handleLock}
                onEndMeeting={handleEndMeeting} onSettings={() => setSettingsOpen(true)}
                onSwitchMode={(mode) => socketRef.current?.emit('switch-mode', { roomId, mode })}
            />
        </div>
    );
}
