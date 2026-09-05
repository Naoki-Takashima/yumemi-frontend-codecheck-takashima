import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/prefectures/route';
import type { Prefecture } from '@/features/population/types';
import { UPSTREAM_BASE_URL, upstreamHandlers } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

const API_KEY = 'test-api-key-should-never-leak';

const UPSTREAM_PATH = `${UPSTREAM_BASE_URL}/api/v1/prefectures`;

describe('GET /api/prefectures', () => {
  beforeEach(() => {
    vi.stubEnv('YUMEMI_API_KEY', API_KEY);
    server.use(...upstreamHandlers);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('47 件の都道府県を返す', async () => {
    const response = await GET();
    const body = (await response.json()) as { result: Prefecture[] };

    expect(response.status).toBe(200);
    expect(body.result).toHaveLength(47);
    expect(body.result[0]).toEqual({ prefCode: 1, prefName: '北海道' });
  });

  it('キャッシュを許可するヘッダを付ける', async () => {
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
  });

  it('上流へのリクエストに X-API-KEY を付ける', async () => {
    let sentApiKey: string | null = null;
    server.use(
      http.get(UPSTREAM_PATH, ({ request }) => {
        sentApiKey = request.headers.get('X-API-KEY');
        return HttpResponse.json({ message: null, result: [] });
      }),
    );

    await GET();

    expect(sentApiKey).toBe(API_KEY);
  });

  it('レスポンスの本文にもヘッダにも API キーを含めない', async () => {
    const response = await GET();
    const text = await response.text();
    const headers = JSON.stringify([...response.headers.entries()]);

    expect(text).not.toContain(API_KEY);
    expect(headers).not.toContain(API_KEY);
  });

  it.each([
    ['配列でない', { prefCode: 1, prefName: '北海道' }],
    ['prefCode が文字列', [{ prefCode: '1', prefName: '北海道' }]],
    ['prefName が欠けている', [{ prefCode: 1 }]],
  ])('想定と違う形（%s）を 502 で止める', async (_label, result) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(UPSTREAM_PATH, () => HttpResponse.json({ message: null, result })));

    const response = await GET();

    expect(response.status).toBe(502);
  });

  it('上流が 403 でも原因を漏らさず 502 を返す', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(UPSTREAM_PATH, () =>
        HttpResponse.json({ message: 'Invalid API key' }, { status: 403 }),
      ),
    );

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).not.toContain('Invalid API key');
    expect(text).not.toContain('403');
  });
});
