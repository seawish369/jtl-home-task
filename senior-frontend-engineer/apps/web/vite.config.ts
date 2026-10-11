import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // worker-only: the plugin serves mockServiceWorker.js in dev and emits it into
  // every build; the app starts it with the stable setupWorker API (src/mocks).
  plugins: [react(), tailwindcss(), msw({ mode: 'worker-only' })],
});
