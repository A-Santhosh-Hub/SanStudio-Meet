/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                dark: {
                    50: '#1e1e2e',
                    100: '#181825',
                    200: '#13131f',
                    300: '#0f0f1a',
                    400: '#0a0a12',
                },
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-up': 'slideInUp 0.4s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'bounce-in': 'bounceIn 0.5s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
                'reaction-fly': 'reactionFly 2s ease-out forwards',
            },
            keyframes: {
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideInUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '70%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
                    '50%': { boxShadow: '0 0 0 12px rgba(99, 102, 241, 0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                reactionFly: {
                    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                    '100%': { transform: 'translateY(-120px) scale(1.5)', opacity: '0' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
