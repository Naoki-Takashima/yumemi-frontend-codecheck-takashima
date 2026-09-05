import { describe, expect, it } from 'vitest';

import { formatPopulation, formatPopulationShort } from '@/features/population/lib/formatNumber';

describe('formatPopulation', () => {
  it('桁区切りと単位を付ける', () => {
    expect(formatPopulation(13_606_683)).toBe('13,606,683 人');
    expect(formatPopulation(0)).toBe('0 人');
  });
});

describe('formatPopulationShort', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [999, '999'],
    [9999, '9,999'],
  ])('1 万未満の %i はそのまま桁区切りにする', (value, expected) => {
    expect(formatPopulationShort(value)).toBe(expected);
  });

  it.each([
    [10_000, '1万'],
    [15_000, '1.5万'],
    [1_000_000, '100万'],
    [13_606_683, '1360.7万'],
    [99_999_999, '10000万'],
  ])('1 万以上 1 億未満の %i は万で表す', (value, expected) => {
    expect(formatPopulationShort(value)).toBe(expected);
  });

  it.each([
    [100_000_000, '1億'],
    [126_000_000, '1.3億'],
  ])('1 億以上の %i は億で表す', (value, expected) => {
    expect(formatPopulationShort(value)).toBe(expected);
  });

  it('境界値でも単位が入れ替わらない', () => {
    expect(formatPopulationShort(9_999)).toBe('9,999');
    expect(formatPopulationShort(10_000)).toBe('1万');
    expect(formatPopulationShort(99_999_999)).toBe('10000万');
    expect(formatPopulationShort(100_000_000)).toBe('1億');
  });
});
