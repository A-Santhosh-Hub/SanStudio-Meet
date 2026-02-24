import { useState, useEffect, useCallback, useRef } from 'react';

export function useMediaDevices() {
    const [devices, setDevices] = useState({ cameras: [], microphones: [], speakers: [] });
    const [stream, setStream] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
    const streamRef = useRef(null);

    const enumerateDevices = useCallback(async () => {
        try {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                cameras: deviceList.filter(d => d.kind === 'videoinput'),
                microphones: deviceList.filter(d => d.kind === 'audioinput'),
                speakers: deviceList.filter(d => d.kind === 'audiooutput'),
            });
        } catch (e) {
            console.warn('enumerateDevices error:', e);
        }
    }, []);

    const getMedia = useCallback(async (constraints = {}) => {
        try {
            const defaultConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: constraints.facingMode || 'user',
                    frameRate: { ideal: 30 },
                },
                ...constraints,
            };

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
            streamRef.current = newStream;
            setStream(newStream);
            await enumerateDevices();
            return newStream;
        } catch (e) {
            console.error('getUserMedia error:', e);
            throw e;
        }
    }, [enumerateDevices]);

    const toggleAudio = useCallback(() => {
        if (!streamRef.current) return;
        streamRef.current.getAudioTracks().forEach(t => {
            t.enabled = !t.enabled;
            setAudioEnabled(t.enabled);
        });
    }, []);

    const toggleVideo = useCallback(() => {
        if (!streamRef.current) return;
        streamRef.current.getVideoTracks().forEach(t => {
            t.enabled = !t.enabled;
            setVideoEnabled(t.enabled);
        });
    }, []);

    const switchCamera = useCallback(async () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        return await getMedia({ facingMode: newFacing });
    }, [facingMode, getMedia]);

    const switchDevice = useCallback(async (deviceId, kind) => {
        if (!streamRef.current) return;
        const constraints =
            kind === 'videoinput'
                ? { video: { deviceId: { exact: deviceId } }, audio: false }
                : { audio: { deviceId: { exact: deviceId } }, video: false };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const [newTrack] = kind === 'videoinput'
            ? newStream.getVideoTracks()
            : newStream.getAudioTracks();

        const kind2 = kind === 'videoinput' ? 'video' : 'audio';
        const oldTracks = streamRef.current.getTracks().filter(t => t.kind === kind2);
        oldTracks.forEach(t => {
            streamRef.current.removeTrack(t);
            t.stop();
        });
        streamRef.current.addTrack(newTrack);
        setStream({ ...streamRef.current });
        return newTrack;
    }, []);

    const getScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always', displaySurface: 'monitor' },
                audio: true,
            });
            return screenStream;
        } catch (e) {
            console.error('getDisplayMedia error:', e);
            return null;
        }
    }, []);

    const stopAll = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return {
        stream,
        streamRef,
        devices,
        audioEnabled,
        videoEnabled,
        getMedia,
        toggleAudio,
        toggleVideo,
        switchCamera,
        switchDevice,
        getScreenShare,
        stopAll,
        enumerateDevices,
    };
}
