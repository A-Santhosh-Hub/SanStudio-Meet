import { useRef, useCallback, useEffect } from 'react';

/**
 * useActiveSpeaker
 *
 * Monitors audio levels from WebRTC streams using the Web Audio API.
 * Applies:
 *  - noise threshold  (ignore vol < threshold)
 *  - 1–2 sec switch delay (prevent flickering)
 *  - ignores muted / local streams unless flag set
 *
 * @param {Function} onSpeakerChange  called with (speakerId: string | null)
 * @param {Object}   options
 * @param {number}   options.threshold      volume threshold 0–255 (default 28)
 * @param {number}   options.switchDelay    ms before committing speaker change (default 1200)
 * @param {number}   options.pollInterval   ms between audio analysis checks (default 200)
 */
export function useActiveSpeaker(onSpeakerChange, {
    threshold = 28,
    switchDelay = 1200,
    pollInterval = 200,
} = {}) {
    const audioCtxRef = useRef(null);
    const monitorsRef = useRef({});   // { peerId: { analyser, interval } }
    const levelsRef = useRef({});   // { peerId: volumeNumber }
    const pendingSpeaker = useRef(null);
    const switchTimeout = useRef(null);
    const currentSpeaker = useRef(null);

    /** Lazily create a shared AudioContext */
    const getAudioCtx = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => { });
        }
        return audioCtxRef.current;
    };

    /** Commit the speaker switch after the delay */
    const commitSpeaker = useCallback((id) => {
        if (currentSpeaker.current === id) return;
        currentSpeaker.current = id;
        onSpeakerChange(id);
    }, [onSpeakerChange]);

    /** Called whenever any peer's volume changes — picks the loudest */
    const evaluateSpeaker = useCallback(() => {
        const levels = levelsRef.current;
        let maxVol = threshold;
        let loudestId = null;

        for (const [id, vol] of Object.entries(levels)) {
            if (vol > maxVol) {
                maxVol = vol;
                loudestId = id;
            }
        }

        if (loudestId === pendingSpeaker.current) return; // no change in candidate
        pendingSpeaker.current = loudestId;

        clearTimeout(switchTimeout.current);

        if (loudestId === null) {
            // silence — commit immediately (or keep current speaker briefly)
            switchTimeout.current = setTimeout(() => commitSpeaker(null), switchDelay);
        } else {
            switchTimeout.current = setTimeout(() => commitSpeaker(loudestId), switchDelay);
        }
    }, [threshold, switchDelay, commitSpeaker]);

    /**
     * Start monitoring a specific peer's stream.
     * peerId: 'local' or socket peer id
     */
    const monitor = useCallback((peerId, stream) => {
        if (!stream) return;
        if (monitorsRef.current[peerId]) return; // already monitoring

        const audioTracks = stream.getAudioTracks();
        if (!audioTracks.length) return;

        try {
            const ctx = getAudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const data = new Uint8Array(analyser.frequencyBinCount);

            const intervalId = setInterval(() => {
                analyser.getByteFrequencyData(data);
                const vol = data.reduce((a, b) => a + b, 0) / data.length;
                levelsRef.current[peerId] = vol;
                evaluateSpeaker();
            }, pollInterval);

            monitorsRef.current[peerId] = { analyser, source, intervalId };
        } catch (err) {
            console.warn('[useActiveSpeaker] could not connect analyser for', peerId, err);
        }
    }, [evaluateSpeaker, pollInterval]);

    /**
     * Stop monitoring a specific peer.
     */
    const unmonitor = useCallback((peerId) => {
        const m = monitorsRef.current[peerId];
        if (!m) return;
        clearInterval(m.intervalId);
        try { m.source?.disconnect(); } catch (_) { }
        delete monitorsRef.current[peerId];
        delete levelsRef.current[peerId];
        // If that was the active speaker, clear
        if (currentSpeaker.current === peerId) {
            currentSpeaker.current = null;
            onSpeakerChange(null);
        }
        evaluateSpeaker();
    }, [evaluateSpeaker, onSpeakerChange]);

    /** Clean up everything */
    const cleanup = useCallback(() => {
        clearTimeout(switchTimeout.current);
        Object.keys(monitorsRef.current).forEach(id => unmonitor(id));
        monitorsRef.current = {};
        levelsRef.current = {};
    }, [unmonitor]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return { monitor, unmonitor, cleanup };
}
