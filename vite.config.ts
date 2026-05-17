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
      output: {
        manualChunks(id) {
          if (id.includes('@reown/appkit') || id.includes('appkit')) return 'appkit';
          if (id.includes('@noble') || id.includes('noble')) return 'crypto';
          if (id.includes('buffer')) return 'buffer';
          if (id.includes('kefine') && id.includes('Workspace')) return 'kefine-core';
        }
      }
    }
  }
};

export default defineConfig(config);
