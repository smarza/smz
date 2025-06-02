import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  cacheDir: resolve(__dirname, '../../.vite-cache'),
  resolve: {
    alias: {
      '@smz-ui/core': resolve(__dirname, '../../libs/smz-core/src/index.ts'),
      '@smz-ui/forms': resolve(__dirname, '../../libs/smz-forms/src/index.ts'),
      '@smz-ui/layout': resolve(__dirname, '../../libs/smz-layout/src/index.ts'),
      '@smz-ui/store': resolve(__dirname, '../../libs/smz-store/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
}); 