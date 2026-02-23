import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false }), svelteTesting()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    globals: true,
    environmentMatchGlobs: [
      ['tests/okr/store.test.ts', 'node'],
      ['tests/okr/components.test.ts', 'jsdom'],
      ['tests/okr/accessibility.test.ts', 'jsdom']
    ],
    environment: 'node',
    setupFiles: ['tests/setup.ts']
  }
});
