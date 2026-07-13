import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// The Crown Season — offline-capable PWA so members never need the book or a signal.
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['stag.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'The Crown Season',
                short_name: 'Crown Season',
                description: 'A daily companion for the Crown Season men’s group.',
                theme_color: '#131313',
                background_color: '#131313',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
            },
        }),
    ],
});
