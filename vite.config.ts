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
    exclude: ['@noble/curves', '@noble/hashes']
  },
  ssr: {
    noExternal: ['@noble/curves', '@noble/hashes']
  },
  define: {
    global: 'globalThis'
  },
  server: {
    allowedHosts: ['dev-proxy.col.pub'],
    fs: {
      allow: [resolve(__dirname, '.meta/data/mocks')]
    },
    watch: {
      ignored: ['**/crater/lib/**']
    }
  },
  ssr: {
    noExternal: ['@noble/curves', '@noble/hashes']
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      checks: {
        pluginTimings: false
      }
    }
  }
});
