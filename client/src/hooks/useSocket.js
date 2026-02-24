import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Connect via Vite's proxy (same origin as the page).
// This keeps everything in a secure HTTPS context on all devices —
// no direct connection to port 3001, no mixed-content errors.
const SOCKET_URL = window.location.origin;


export function useSocket() {
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        socketRef.current.on('connect', () => {
            console.log('[Socket] Connected:', socketRef.current.id);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    }, []);

    const emit = useCallback((event, data) => {
        socketRef.current?.emit(event, data);
    }, []);

    const off = useCallback((event, handler) => {
        socketRef.current?.off(event, handler);
    }, []);

    return { socket: socketRef.current, on, emit, off, socketRef };
}
