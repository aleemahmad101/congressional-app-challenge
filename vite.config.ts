import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths so the built site works from a GitHub Pages project subpath
  // (username.github.io/repo/) as well as from a domain root.
  base: './',
  server: { port: 5174, strictPort: true },
});
