import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type UserConfig } from 'vite';
import { resolve } from 'node:path';
import compression from 'vite-plugin-compression2';

const config: UserConfig & { test?: Record<string, unknown> } = {
  plugins: [sveltekit(), compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/], threshold: 512 })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'e2e', 'crater', '.svelte-kit', 'build']
  },
  resolve: {
    alias: {
      buffer: resolve(__dirname, 'node_modules/buffer')
    }
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
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // Use rollup instead of rolldown to avoid noble package issues
    }
  }
};

export default defineConfig(config);
