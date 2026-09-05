import { describe, expect, it } from 'vitest';

import {
  BOUNDARY_YEAR,
  POPULATION_LABELS,
  POPULATION_YEARS,
  createPopulationFixture,
} from '@/test/fixtures/population';

describe('人口構成フィクスチャ', () => {
  const fixture = createPopulationFixture(13);

  it('実 API と同じ 4 系列を持つ', () => {
    expect(fixture.data.map((series) => series.label)).toEqual([...POPULATION_LABELS]);
  });

  it('boundaryYear は 2020', () => {
    expect(fixture.boundaryYear).toBe(BOUNDARY_YEAR);
  });

  it('各系列が 1960〜2045 年の 5 年刻みで 18 点を持つ', () => {
    expect(POPULATION_YEARS).toHaveLength(18);

    for (const series of fixture.data) {
      expect(series.data.map((point) => point.year)).toEqual([...POPULATION_YEARS]);
    }
  });

  it('総人口だけが rate を持たない', () => {
    const [total, ...others] = fixture.data;

    expect(total?.data.every((point) => point.rate === undefined)).toBe(true);
    for (const series of others) {
      expect(series.data.every((point) => typeof point.rate === 'number')).toBe(true);
    }
  });

  it('年少・生産年齢・老年の合計が総人口と一致する', () => {
    const [total, young, working, elderly] = fixture.data;

    POPULATION_YEARS.forEach((_, index) => {
      const sum =
        (young?.data[index]?.value ?? 0) +
        (working?.data[index]?.value ?? 0) +
        (elderly?.data[index]?.value ?? 0);

      expect(sum).toBe(total?.data[index]?.value);
    });
  });

  it('prefCode ごとに異なるデータを返す', () => {
    const tokyo = createPopulationFixture(13);
    const osaka = createPopulationFixture(27);

    expect(tokyo.data[0]?.data[0]?.value).not.toBe(osaka.data[0]?.data[0]?.value);
  });
});
