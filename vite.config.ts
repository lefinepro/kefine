import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      buffer: resolve(__dirname, 'node_modules/buffer')
    }
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: [
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@reown/appkit/networks',
      'wagmi',
      'viem'
    ]
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '.meta/data/mocks')]
    }
  },
  build: {
    target: 'esnext',
  }
});
