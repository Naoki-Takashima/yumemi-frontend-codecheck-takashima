import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/test/msw/server';

// onUnhandledRequest: 'error' により、モックし忘れたリクエストはテストを失敗させる。
// テストが実際の API を叩いてしまう事故を防ぐ。
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
