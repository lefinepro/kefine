import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type UserConfig } from 'vite';
import { resolve } from 'node:path';

const config: UserConfig & { test?: Record<string, unknown> } = {
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'e2e', 'crater', '.svelte-kit', 'build']
  },
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
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // Use rollup instead of rolldown to avoid noble package issues
    }
  }
};

export default defineConfig(config);
