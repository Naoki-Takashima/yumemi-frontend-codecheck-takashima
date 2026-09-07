import { describe, expect, it } from 'vitest';

import { sortByPopulationDesc } from '@/features/population/lib/sortTooltipItems';

function item(name: string, value?: unknown) {
  return { name, value };
}

function names(items: { name: string }[]) {
  return items.map((entry) => entry.name);
}

describe('sortByPopulationDesc', () => {
  describe('基本', () => {
    it('人口数の多い順に並べる', () => {
      const result = sortByPopulationDesc([
        item('高知県', 690_000),
        item('東京都', 14_000_000),
        item('岩手県', 1_200_000),
      ]);

      expect(names(result)).toEqual(['東京都', '岩手県', '高知県']);
    });

    it('空の配列をそのまま返す', () => {
      expect(sortByPopulationDesc([])).toEqual([]);
    });
  });

  describe('元の配列の扱い', () => {
    it('渡された配列を書き換えない', () => {
      // payload は Recharts が持っている配列なので破壊してはいけない
      const items = [item('高知県', 690_000), item('東京都', 14_000_000)];

      sortByPopulationDesc(items);

      expect(names(items)).toEqual(['高知県', '東京都']);
    });
  });

  describe('比較できない値', () => {
    it('その年のデータが無い都道府県を末尾にまとめる', () => {
      const result = sortByPopulationDesc([
        item('沖縄県', undefined),
        item('高知県', 690_000),
        item('東京都', 14_000_000),
      ]);

      expect(names(result)).toEqual(['東京都', '高知県', '沖縄県']);
    });

    it('末尾に送るものどうしは元の並びを保つ', () => {
      const result = sortByPopulationDesc([
        item('沖縄県', undefined),
        item('京都府', 2_500_000),
        item('北海道', undefined),
      ]);

      expect(names(result)).toEqual(['京都府', '沖縄県', '北海道']);
    });
  });

  describe('同じ値', () => {
    it('元の並びを保つ', () => {
      const result = sortByPopulationDesc([
        item('大阪府', 500_000),
        item('北海道', 1_000_000),
        item('京都府', 1_000_000),
      ]);

      expect(names(result)).toEqual(['北海道', '京都府', '大阪府']);
    });
  });
});
