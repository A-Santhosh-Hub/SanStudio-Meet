import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        basicSsl(), // Generates a self-signed cert → HTTPS for camera/mic on LAN
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,       // Expose on 0.0.0.0 for LAN access
        port: 5173,
        https: true,      // Enables HTTPS (required for camera/mic on non-localhost)
        proxy: {
            // All /api and /socket.io traffic is proxied to the backend
            // Browser never talks directly to port 3001 — stays in secure context
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3001',
                ws: true,
                changeOrigin: true,
            },
        },
    },
});
