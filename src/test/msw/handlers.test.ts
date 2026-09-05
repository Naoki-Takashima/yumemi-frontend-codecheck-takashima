import { describe, expect, it } from 'vitest';

import { prefecturesFixture } from '@/test/fixtures/prefectures';

/**
 * MSW が BFF の経路を横取りできているかを確認する。
 * ここが通らない場合、以降のコンポーネントテストはすべて実 API を叩こうとして失敗する。
 */
describe('MSW ハンドラ', () => {
  it('/api/prefectures が 47 件を返す', async () => {
    const response = await fetch('http://localhost/api/prefectures');
    const body = (await response.json()) as { result: typeof prefecturesFixture };

    expect(response.status).toBe(200);
    expect(body.result).toHaveLength(47);
    expect(body.result[0]).toEqual({ prefCode: 1, prefName: '北海道' });
  });

  it('/api/population が指定した prefCode のデータを返す', async () => {
    const response = await fetch('http://localhost/api/population?prefCode=13');
    const body = (await response.json()) as { result: { boundaryYear: number } };

    expect(response.status).toBe(200);
    expect(body.result.boundaryYear).toBe(2020);
  });

  it('/api/population が範囲外の prefCode を 400 で拒否する', async () => {
    const response = await fetch('http://localhost/api/population?prefCode=48');

    expect(response.status).toBe(400);
  });
});
