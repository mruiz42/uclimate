import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API runs separately in dev; proxying keeps the browser same-origin (no CORS).
    proxy: { '/api': 'http://localhost:4200' },
  },
  build: {
    // maplibre-gl is ~800 kB on its own and already split into its own chunk.
    chunkSizeWarningLimit: 900,
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
