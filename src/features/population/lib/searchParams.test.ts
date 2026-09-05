import { describe, expect, it } from 'vitest';

import { MAX_SELECTABLE_PREFECTURES } from '@/features/population/constants';
import {
  parseSelection,
  serializeSelection,
  type ChartSelection,
} from '@/features/population/lib/searchParams';

function parse(query: string) {
  return parseSelection(new URLSearchParams(query));
}

describe('parseSelection', () => {
  describe('都道府県コード', () => {
    it('カンマ区切りの値を読み取る', () => {
      expect(parse('prefCodes=13,27').prefCodes).toEqual([13, 27]);
    });

    it('URL に書かれた順を保つ（並べ替えない）', () => {
      // 凡例の並びが利用者の選んだ順と一致するようにするため
      expect(parse('prefCodes=27,1,13').prefCodes).toEqual([27, 1, 13]);
    });

    it('指定が無ければ空にする', () => {
      expect(parse('').prefCodes).toEqual([]);
      expect(parse('prefCodes=').prefCodes).toEqual([]);
    });

    it('重複を取り除く', () => {
      expect(parse('prefCodes=13,13,27,13').prefCodes).toEqual([13, 27]);
    });

    it.each([
      ['prefCodes=0', '下限より小さい'],
      ['prefCodes=48', '上限より大きい'],
      ['prefCodes=abc', '数値でない'],
      ['prefCodes=1.5', '小数'],
      ['prefCodes=-1', '負の数'],
      ['prefCodes=１３', '全角数字'],
    ])('不正な値だけの %s は空にする（%s）', (query) => {
      expect(parse(query).prefCodes).toEqual([]);
    });

    it('不正な値が混ざっていても、妥当な値は残す', () => {
      expect(parse('prefCodes=13,abc,27,999,1').prefCodes).toEqual([13, 27, 1]);
    });

    it('区切りが連続していても壊れない', () => {
      expect(parse('prefCodes=13,,27,').prefCodes).toEqual([13, 27]);
    });
  });

  describe('選択できる上限', () => {
    it('上限までは読み取る', () => {
      const codes = Array.from({ length: MAX_SELECTABLE_PREFECTURES }, (_, i) => i + 1);

      expect(parse(`prefCodes=${codes.join(',')}`).prefCodes).toHaveLength(
        MAX_SELECTABLE_PREFECTURES,
      );
    });

    it('上限を超える分は切り捨てる', () => {
      // URL 経由で上限を超えられては、制限した意味がなくなる
      const codes = Array.from({ length: 20 }, (_, i) => i + 1);
      const result = parse(`prefCodes=${codes.join(',')}`);

      expect(result.prefCodes).toHaveLength(MAX_SELECTABLE_PREFECTURES);
      expect(result.prefCodes).toEqual(codes.slice(0, MAX_SELECTABLE_PREFECTURES));
    });

    it('47 件すべて並べても上限で止まる', () => {
      const codes = Array.from({ length: 47 }, (_, i) => i + 1);

      expect(parse(`prefCodes=${codes.join(',')}`).prefCodes).toHaveLength(
        MAX_SELECTABLE_PREFECTURES,
      );
    });
  });

  describe('人口種別', () => {
    it.each(['total', 'young', 'working', 'elderly'] as const)('%s を読み取る', (type) => {
      expect(parse(`type=${type}`).type).toBe(type);
    });

    it.each([
      ['type=unknown', '定義にない値'],
      ['type=', '空文字'],
      ['type=TOTAL', '大文字'],
      ['', '指定なし'],
    ])('%s は総人口に落とす（%s）', (query) => {
      expect(parse(query).type).toBe('total');
    });
  });

  describe('組み合わせ', () => {
    it('都道府県と種別を同時に読み取る', () => {
      expect(parse('prefCodes=13,27&type=young')).toEqual({
        prefCodes: [13, 27],
        type: 'young',
      });
    });

    it('関係のないクエリは無視する', () => {
      expect(parse('prefCodes=13&foo=bar&type=elderly')).toEqual({
        prefCodes: [13],
        type: 'elderly',
      });
    });
  });
});

describe('serializeSelection', () => {
  it('都道府県と種別をクエリにする', () => {
    expect(serializeSelection({ prefCodes: [13, 27], type: 'young' })).toBe(
      'prefCodes=13%2C27&type=young',
    );
  });

  it('選択が無ければキーごと落とす', () => {
    expect(serializeSelection({ prefCodes: [], type: 'young' })).toBe('type=young');
  });

  it('既定の種別はキーごと落とす', () => {
    // 何も操作していない状態で ?type=total が残ると、共有したリンクが読みにくい
    expect(serializeSelection({ prefCodes: [13], type: 'total' })).toBe('prefCodes=13');
  });

  it('どちらも既定なら空文字になる', () => {
    expect(serializeSelection({ prefCodes: [], type: 'total' })).toBe('');
  });
});

describe('parse と serialize の往復', () => {
  it.each<ChartSelection>([
    { prefCodes: [], type: 'total' },
    { prefCodes: [13], type: 'total' },
    { prefCodes: [13, 27, 1], type: 'young' },
    { prefCodes: [47], type: 'elderly' },
  ])('%j は往復しても変わらない', (selection) => {
    expect(parse(serializeSelection(selection))).toEqual(selection);
  });
});
