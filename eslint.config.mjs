import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  globalIgnores([
    // eslint-config-next の既定 ignore を明示的に再宣言する
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // 追加
    'node_modules/**',
    'coverage/**',
  ]),

  ...nextVitals,
  ...nextTs,

  // 型情報を使うルール。Promise の投げっぱなしなど、構文だけでは気付けない問題を拾う。
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // API キーを扱うサーバー専用モジュールを、クライアントへ漏らさないためのガード。
  // `server-only` パッケージがビルド時に弾くが、lint でより早く気付けるようにする。
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/api/**', 'src/shared/api/server/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/shared/api/server', '@/shared/api/server/**', '**/api/server/**'],
              message:
                'API キーを扱うサーバー専用モジュールです。Route Handler (src/app/api/**) からのみ import してください。',
            },
          ],
        },
      ],
    },
  },

  // Prettier と競合する整形系ルールを無効化する。必ず最後に置く。
  prettier,
]);

export default eslintConfig;
