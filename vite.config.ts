import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [sveltekit()],
  cacheDir: '.vite-cache',
  optimizeDeps: {
    exclude: [
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@reown/appkit/networks',
      'wagmi',
      'viem'
    ]
  },
  server: {
    // allowedHosts: ['lefine.pro', 'www.lefine.pro'],
    fs: {
      allow: [resolve(__dirname, '.meta/data/mocks')]
    }
  },
  preview: {
    host: true,
    allowedHosts: ['lefine.pro', 'www.lefine.pro']
  },
  build: {
    target: 'esnext',
  }
});
