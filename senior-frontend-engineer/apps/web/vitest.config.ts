import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so unit tests don't load the app's plugins (MSW, Tailwind).
export default defineConfig({
  test: {
    environment: 'node',
  },
});
