import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError, UNKNOWN_ERROR_CODE, fetchJson } from '@/shared/api/client/fetchJson';
import { server } from '@/test/msw/server';

describe('fetchJson', () => {
  const ENDPOINT = '/api/example';

  it('BFF のレスポンスをそのまま返す', async () => {
    server.use(http.get(`*${ENDPOINT}`, () => HttpResponse.json({ result: 'ok' })));

    const body = await fetchJson<{ result: string }>(ENDPOINT);

    expect(body.result).toBe('ok');
  });

  it.each([
    ['https://example.com/api/leak', '絶対 URL'],
    ['/other', '/api/ 以外の相対パス'],
    ['api/example', '先頭のスラッシュなし'],
    ['//example.com/api/leak', 'プロトコル相対 URL'],
  ])('%s を拒否する（%s）', async (path) => {
    await expect(fetchJson(path)).rejects.toThrow('相対パスのみ');
  });

  it('外部ホストを指定した時点で通信すら行わない', async () => {
    let called = false;
    server.use(
      http.get('https://example.com/api/leak', () => {
        called = true;
        return HttpResponse.json({});
      }),
    );

    await expect(fetchJson('https://example.com/api/leak')).rejects.toThrow();
    expect(called).toBe(false);
  });

  it('エラーレスポンスを ApiError に変換する', async () => {
    server.use(
      http.get(`*${ENDPOINT}`, () =>
        HttpResponse.json(
          { error: { code: 'SOME_ERROR', message: '失敗しました' } },
          { status: 400 },
        ),
      ),
    );

    const error = (await fetchJson(ENDPOINT).catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('SOME_ERROR');
    expect(error.message).toBe('失敗しました');
  });

  it('JSON として読めない本文でも例外にせず既定の文言を使う', async () => {
    server.use(
      http.get(`*${ENDPOINT}`, () => new HttpResponse('<html>500</html>', { status: 500 })),
    );

    const error = (await fetchJson(ENDPOINT).catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(UNKNOWN_ERROR_CODE);
    expect(error.message).toBe('データを取得できませんでした。');
  });
});
