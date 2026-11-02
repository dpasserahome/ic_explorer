import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the static build works from any host path (GitHub Pages, LMS, etc.).
export default defineConfig({
  base: './',
  plugins: [react()],
});
