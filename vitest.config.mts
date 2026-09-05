import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig の paths（@/*）をテストでもそのまま解決させる
    tsconfigPaths: true,
    alias: [
      {
        // server-only は「react-server」条件でしか読めず、そのままでは例外を投げる。
        // テストでは無害なスタブに差し替える（本番ビルドはこの設定を通らない）。
        find: /^server-only$/,
        replacement: fileURLToPath(new URL('./src/test/stubs/server-only.ts', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.{test,spec}.{ts,tsx}',
        // ストーリーは表示確認用でテスト対象ではない
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    },
  },
});
