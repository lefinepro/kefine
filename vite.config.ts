import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  preview: {
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
});
