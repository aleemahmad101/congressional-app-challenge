import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths so a static build works from a project subpath
  // (GitHub Pages) as well as from a domain root (Netlify).
  base: './',
  server: { port: 5174, strictPort: true },
});
