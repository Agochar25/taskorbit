import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@taskorbit/shared': path.resolve(here, '../shared/index.js') } },
  server: { port: 5173, fs: { allow: ['..'] } },
});
