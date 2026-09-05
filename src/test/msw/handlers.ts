import { http, HttpResponse } from 'msw';

import { createPopulationFixture } from '@/test/fixtures/population';
import { prefecturesFixture } from '@/test/fixtures/prefectures';

/** 上流 API のベース URL。Route Handler のテストではこちらをモックする。 */
export const UPSTREAM_BASE_URL = 'https://frontend-engineer-codecheck-api.mirai.yumemi.io';

/**
 * 自前の BFF（Route Handler）に対するハンドラ。
 * ブラウザ側のコードはこの経路しか叩かないため、コンポーネントのテストではこれを使う。
 *
 * オリジンをワイルドカードにしているのは、jsdom の location が
 * テスト環境によって変わっても一致させるため。
 */
export const handlers = [
  http.get('*/api/prefectures', () => {
    return HttpResponse.json({ result: prefecturesFixture });
  }),

  http.get('*/api/population', ({ request }) => {
    const prefCode = Number(new URL(request.url).searchParams.get('prefCode'));

    if (!Number.isInteger(prefCode) || prefCode < 1 || prefCode > 47) {
      return HttpResponse.json(
        { error: { code: 'INVALID_PREF_CODE', message: 'prefCode が不正です' } },
        { status: 400 },
      );
    }

    return HttpResponse.json({ result: createPopulationFixture(prefCode) });
  }),
];

/**
 * 上流 API に対するハンドラ。Route Handler 自体をテストするときに使う。
 * `server.use(...upstreamHandlers)` の形で個別に差し込む。
 */
export const upstreamHandlers = [
  http.get(`${UPSTREAM_BASE_URL}/api/v1/prefectures`, () => {
    return HttpResponse.json({ message: null, result: prefecturesFixture });
  }),

  http.get(`${UPSTREAM_BASE_URL}/api/v1/population/composition/perYear`, ({ request }) => {
    const prefCode = Number(new URL(request.url).searchParams.get('prefCode'));
    return HttpResponse.json({ message: null, result: createPopulationFixture(prefCode) });
  }),
];
