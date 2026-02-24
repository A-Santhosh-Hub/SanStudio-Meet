import { useRef, useCallback } from 'react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

// Accepts socketRef (a ref object) so it's never null at call time
export function useWebRTC({ onRemoteStream, onRemoveStream, socketRef, roomId }) {
    const peersRef = useRef({});
    const localStreamRef = useRef(null);

    const setLocalStream = useCallback((stream) => {
        localStreamRef.current = stream;
    }, []);

    const createPeer = useCallback((peerId, isInitiator) => {
        if (peersRef.current[peerId]) {
            peersRef.current[peerId].close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current[peerId] = pc;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // ICE candidates — use socketRef.current so it's never stale
        pc.onicecandidate = ({ candidate }) => {
            if (candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { to: peerId, candidate });
            }
        };

        // Remote stream
        pc.ontrack = ({ streams }) => {
            if (streams[0]) onRemoteStream(peerId, streams[0]);
        };

        // Connection state
        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                onRemoveStream(peerId);
                delete peersRef.current[peerId];
            }
        };

        if (isInitiator) {
            pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    if (socketRef.current) {
                        socketRef.current.emit('offer', { to: peerId, offer: pc.localDescription });
                    }
                })
                .catch(console.error);
        }

        return pc;
    }, [socketRef, onRemoteStream, onRemoveStream]);

    const handleOffer = useCallback(async ({ from, offer }) => {
        const pc = createPeer(from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (socketRef.current) {
            socketRef.current.emit('answer', { to: from, answer: pc.localDescription });
        }
    }, [createPeer, socketRef]);

    const handleAnswer = useCallback(async ({ from, answer }) => {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    const handleIceCandidate = useCallback(async ({ from, candidate }) => {
        const pc = peersRef.current[from];
        if (pc && candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { console.warn('ICE candidate error:', e); }
        }
    }, []);

    const replaceTrack = useCallback((newTrack, kind) => {
        Object.values(peersRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === kind);
            if (sender && newTrack) sender.replaceTrack(newTrack);
        });
    }, []);

    const removePeer = useCallback((peerId) => {
        const pc = peersRef.current[peerId];
        if (pc) { pc.close(); delete peersRef.current[peerId]; }
        onRemoveStream(peerId);
    }, [onRemoveStream]);

    const closeAll = useCallback(() => {
        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
    }, []);

    return {
        setLocalStream,
        createPeer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        replaceTrack,
        removePeer,
        closeAll,
        peersRef,
    };
}
