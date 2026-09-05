import { describe, expect, it } from 'vitest';

import { parsePrefCode } from '@/features/population/prefCode';

describe('parsePrefCode', () => {
  it('1〜47 の整数を受け付ける', () => {
    expect(parsePrefCode('1')).toBe(1);
    expect(parsePrefCode('13')).toBe(13);
    expect(parsePrefCode('47')).toBe(47);
  });

  it.each([
    ['0', '下限より小さい'],
    ['48', '上限より大きい'],
    ['999', '大きく外れた値'],
  ])('範囲外の %s を拒否する（%s）', (raw) => {
    expect(parsePrefCode(raw)).toBeNull();
  });

  it.each([
    ['1.5', '小数'],
    ['+1', '符号つき'],
    ['-1', '負の数'],
    ['1e1', '指数表記'],
    ['0x1', '16 進表記'],
    ['', '空文字'],
    [' 13 ', '前後の空白'],
    ['１３', '全角数字'],
  ])('数値に化けうる表記 %s を拒否する（%s）', (raw) => {
    expect(parsePrefCode(raw)).toBeNull();
  });

  it.each([
    ['1;2', 'セミコロン区切り'],
    ['1,2', 'カンマ区切り'],
    ['13/../secret', 'パス片'],
    ['13&prefCode=27', 'クエリの追記'],
  ])('区切り文字を含む %s を拒否する（%s）', (raw) => {
    expect(parsePrefCode(raw)).toBeNull();
  });

  it('null と undefined を拒否する', () => {
    expect(parsePrefCode(null)).toBeNull();
    expect(parsePrefCode(undefined)).toBeNull();
  });
});
