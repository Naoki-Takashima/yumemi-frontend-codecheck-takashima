import { setupServer } from 'msw/node';

import { handlers } from '@/test/msw/handlers';

/**
 * テスト全体で共有する MSW サーバー。
 * 起動と停止は vitest.setup.ts が行う。
 */
export const server = setupServer(...handlers);
