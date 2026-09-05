import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/population/route';
import { UPSTREAM_BASE_URL, upstreamHandlers } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

const API_KEY = 'test-api-key-should-never-leak';

const UPSTREAM_PATH = `${UPSTREAM_BASE_URL}/api/v1/population/composition/perYear`;

function requestFor(query: string) {
  return new NextRequest(`http://localhost:3000/api/population${query}`);
}

describe('GET /api/population', () => {
  beforeEach(() => {
    vi.stubEnv('YUMEMI_API_KEY', API_KEY);
    server.use(...upstreamHandlers);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('prefCode の検証', () => {
    it.each(['?prefCode=0', '?prefCode=48', '?prefCode=abc', '?prefCode=1;2', '?prefCode=', ''])(
      '%s を 400 で拒否する',
      async (query) => {
        const response = await GET(requestFor(query));
        const body = (await response.json()) as { error: { code: string } };

        expect(response.status).toBe(400);
        expect(body.error.code).toBe('INVALID_PREF_CODE');
      },
    );

    it('不正な prefCode のときは上流 API を呼ばない', async () => {
      let upstreamCalled = false;
      server.use(
        http.get(UPSTREAM_PATH, () => {
          upstreamCalled = true;
          return HttpResponse.json({ message: null, result: {} });
        }),
      );

      await GET(requestFor('?prefCode=48'));

      expect(upstreamCalled).toBe(false);
    });
  });

  describe('正常系', () => {
    it('人口構成を返す', async () => {
      const response = await GET(requestFor('?prefCode=13'));
      const body = (await response.json()) as { result: { boundaryYear: number } };

      expect(response.status).toBe(200);
      expect(body.result.boundaryYear).toBe(2020);
    });

    it('キャッシュを許可するヘッダを付ける', async () => {
      const response = await GET(requestFor('?prefCode=13'));

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
    });

    it('検証を通った prefCode だけを上流に渡す', async () => {
      let receivedPrefCode: string | null = null;
      server.use(
        http.get(UPSTREAM_PATH, ({ request }) => {
          receivedPrefCode = new URL(request.url).searchParams.get('prefCode');
          return HttpResponse.json({ message: null, result: { boundaryYear: 2020, data: [] } });
        }),
      );

      await GET(requestFor('?prefCode=13'));

      expect(receivedPrefCode).toBe('13');
    });
  });

  describe('API キーの取り扱い', () => {
    it('上流へのリクエストに X-API-KEY を付ける', async () => {
      let sentApiKey: string | null = null;
      server.use(
        http.get(UPSTREAM_PATH, ({ request }) => {
          sentApiKey = request.headers.get('X-API-KEY');
          return HttpResponse.json({ message: null, result: { boundaryYear: 2020, data: [] } });
        }),
      );

      await GET(requestFor('?prefCode=13'));

      expect(sentApiKey).toBe(API_KEY);
    });

    it('レスポンスの本文にもヘッダにも API キーを含めない', async () => {
      const response = await GET(requestFor('?prefCode=13'));
      const text = await response.text();
      const headers = JSON.stringify([...response.headers.entries()]);

      expect(text).not.toContain(API_KEY);
      expect(headers).not.toContain(API_KEY);
    });

    it('API キーが未設定でも 503 を返し、原因を漏らさない', async () => {
      vi.stubEnv('YUMEMI_API_KEY', '');
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const response = await GET(requestFor('?prefCode=13'));
      const text = await response.text();

      expect(response.status).toBe(503);
      expect(text).not.toContain('YUMEMI_API_KEY');
      expect(text).not.toContain('環境変数');
    });
  });

  describe('上流のレスポンス検証', () => {
    it.each([
      ['boundaryYear が欠けている', { data: [] }],
      ['boundaryYear が文字列', { boundaryYear: '2020', data: [] }],
      ['data が配列でない', { boundaryYear: 2020, data: null }],
      [
        '系列の value が文字列',
        {
          boundaryYear: 2020,
          data: [{ label: '総人口', data: [{ year: 1960, value: '5039206' }] }],
        },
      ],
      ['result が空オブジェクト', {}],
    ])('想定と違う形（%s）を 502 で止める', async (_label, result) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(http.get(UPSTREAM_PATH, () => HttpResponse.json({ message: null, result })));

      const response = await GET(requestFor('?prefCode=13'));

      expect(response.status).toBe(502);
    });

    it('検証内容をクライアントに漏らさない', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(
        http.get(UPSTREAM_PATH, () =>
          HttpResponse.json({ message: null, result: { boundaryYear: '2020' } }),
        ),
      );

      const text = await (await GET(requestFor('?prefCode=13'))).text();

      expect(text).not.toContain('boundaryYear');
      expect(text).not.toContain('invalid_type');
    });

    it('封筒の形が違う場合も 502 で止める', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(http.get(UPSTREAM_PATH, () => HttpResponse.json({ unexpected: true })));

      const response = await GET(requestFor('?prefCode=13'));

      expect(response.status).toBe(502);
    });
  });

  describe('上流へ到達できない場合', () => {
    it('通信が成立しないときは 500 ではなく 503 を返す', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(http.get(UPSTREAM_PATH, () => HttpResponse.error()));

      const response = await GET(requestFor('?prefCode=13'));
      const body = (await response.json()) as { error: { code: string } };

      expect(response.status).toBe(503);
      expect(body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    });

    it('通信の失敗理由をクライアントに漏らさない', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(http.get(UPSTREAM_PATH, () => HttpResponse.error()));

      const text = await (await GET(requestFor('?prefCode=13'))).text();

      expect(text).not.toContain('fetch');
      expect(text).not.toContain('CERT');
      expect(text).not.toContain(UPSTREAM_BASE_URL);
    });
  });

  describe('上流のエラー', () => {
    it.each([403, 404, 500])('上流の %i をそのまま返さず 502 に正規化する', async (status) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      server.use(
        http.get(UPSTREAM_PATH, () =>
          HttpResponse.json({ message: '上流の内部メッセージ' }, { status }),
        ),
      );

      const response = await GET(requestFor('?prefCode=13'));
      const text = await response.text();

      expect(response.status).toBe(502);
      expect(text).not.toContain('上流の内部メッセージ');
      expect(text).not.toContain(String(status));
    });
  });
});
