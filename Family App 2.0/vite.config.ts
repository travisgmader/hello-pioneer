import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite + React 19. PWA wiring (vite-plugin-pwa) is intentionally deferred to
// Plan 06 of this phase per the plan map — do not add VitePWA here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
