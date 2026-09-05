import { describe, expect, it } from 'vitest';

import { toChartSeries, type PopulationEntry } from '@/features/population/lib/toChartSeries';
import type { PopulationComposition } from '@/features/population/types';
import { createPopulationFixture } from '@/test/fixtures/population';

function entry(prefCode: number, prefName: string): PopulationEntry {
  return { prefCode, prefName, composition: createPopulationFixture(prefCode) };
}

/** 年や系列を自由に組めるようにした最小の構成。 */
function composition(
  data: { label: string; points: { year: number; value: number }[] }[],
  boundaryYear = 2020,
): PopulationComposition {
  return {
    boundaryYear,
    data: data.map((series) => ({
      label: series.label,
      data: series.points,
    })),
  };
}

describe('toChartSeries', () => {
  describe('基本', () => {
    it('選択が無いときは空の結果を返す', () => {
      const result = toChartSeries([], 'total');

      expect(result.rows).toEqual([]);
      expect(result.prefNames).toEqual([]);
      expect(result.boundaryYear).toBeNull();
    });

    it('1 県分を年の昇順で並べる', () => {
      const result = toChartSeries([entry(13, '東京都')], 'total');

      expect(result.prefNames).toEqual(['東京都']);
      expect(result.rows).toHaveLength(18);
      expect(result.rows[0]?.year).toBe(1960);
      expect(result.rows.at(-1)?.year).toBe(2045);
      expect(result.rows.map((row) => row.year)).toEqual(
        [...result.rows.map((row) => row.year)].sort((a, b) => a - b),
      );
    });

    it('複数県を 1 行にまとめる', () => {
      const result = toChartSeries([entry(13, '東京都'), entry(27, '大阪府')], 'total');

      expect(result.prefNames).toEqual(['東京都', '大阪府']);
      expect(result.rows[0]).toEqual({
        year: 1960,
        東京都: 13 * 100_000,
        大阪府: 27 * 100_000,
      });
    });

    it('選択の順序が系列の順序になる', () => {
      const result = toChartSeries([entry(27, '大阪府'), entry(13, '東京都')], 'total');

      expect(result.prefNames).toEqual(['大阪府', '東京都']);
    });
  });

  describe('人口種別', () => {
    it.each([
      ['total', '総人口'],
      ['young', '年少人口'],
      ['working', '生産年齢人口'],
      ['elderly', '老年人口'],
    ] as const)('%s は「%s」の系列を取り出す', (type, label) => {
      const fixture = createPopulationFixture(13);
      const expected = fixture.data.find((series) => series.label === label)?.data[0]?.value;

      const result = toChartSeries([entry(13, '東京都')], type);

      expect(result.rows[0]?.['東京都']).toBe(expected);
    });

    it('指定した種別の系列を持たない県は結果に含めない', () => {
      const partial: PopulationEntry = {
        prefCode: 1,
        prefName: '北海道',
        composition: composition([{ label: '総人口', points: [{ year: 1960, value: 100 }] }]),
      };

      const result = toChartSeries([partial], 'young');

      expect(result.prefNames).toEqual([]);
      expect(result.rows).toEqual([]);
    });
  });

  describe('年がそろっていない場合', () => {
    const tokyo: PopulationEntry = {
      prefCode: 13,
      prefName: '東京都',
      composition: composition([
        {
          label: '総人口',
          points: [
            { year: 1960, value: 100 },
            { year: 1970, value: 200 },
          ],
        },
      ]),
    };

    const osaka: PopulationEntry = {
      prefCode: 27,
      prefName: '大阪府',
      composition: composition([
        {
          label: '総人口',
          points: [
            { year: 1970, value: 300 },
            { year: 1980, value: 400 },
          ],
        },
      ]),
    };

    it('年は和集合を採る', () => {
      const result = toChartSeries([tokyo, osaka], 'total');

      expect(result.rows.map((row) => row.year)).toEqual([1960, 1970, 1980]);
    });

    it('値が無い年は undefined にする（0 で埋めない）', () => {
      const result = toChartSeries([tokyo, osaka], 'total');

      expect(result.rows[0]).toEqual({ year: 1960, 東京都: 100, 大阪府: undefined });
      expect(result.rows[2]).toEqual({ year: 1980, 東京都: undefined, 大阪府: 400 });
    });

    it('重なる年は両方の値が入る', () => {
      const result = toChartSeries([tokyo, osaka], 'total');

      expect(result.rows[1]).toEqual({ year: 1970, 東京都: 200, 大阪府: 300 });
    });
  });

  describe('boundaryYear', () => {
    it('すべて同じなら その値を返す', () => {
      const result = toChartSeries([entry(13, '東京都'), entry(27, '大阪府')], 'total');

      expect(result.boundaryYear).toBe(2020);
    });

    it('県ごとに違う場合は最も小さい値を採る', () => {
      const a: PopulationEntry = {
        prefCode: 1,
        prefName: 'A',
        composition: composition([{ label: '総人口', points: [{ year: 2000, value: 1 }] }], 2020),
      };
      const b: PopulationEntry = {
        prefCode: 2,
        prefName: 'B',
        composition: composition([{ label: '総人口', points: [{ year: 2000, value: 2 }] }], 2015),
      };

      // 小さい方を採らないと、推計値を実績として見せてしまう年が出る
      expect(toChartSeries([a, b], 'total').boundaryYear).toBe(2015);
    });
  });
});
