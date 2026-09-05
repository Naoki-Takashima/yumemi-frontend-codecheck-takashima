import { describe, expect, it } from 'vitest';

import { SERIES_SHAPES, seriesColor, seriesShape } from '@/features/population/lib/seriesColor';

const PREF_CODES = Array.from({ length: 47 }, (_, index) => index + 1);

/** hsl(H S% L%) を分解する。 */
function parseHsl(color: string) {
  const matched = /^hsl\((\d+(?:\.\d+)?) (\d+)% (\d+)%\)$/.exec(color);

  if (!matched?.[1] || !matched[2] || !matched[3]) {
    throw new Error(`hsl として解釈できません: ${color}`);
  }

  return {
    hue: Number(matched[1]),
    saturation: Number(matched[2]),
    lightness: Number(matched[3]),
  };
}

/** 色相環上の距離（0〜180）。 */
function hueDistance(a: number, b: number) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

describe('seriesColor', () => {
  describe('安定性', () => {
    it('同じ prefCode には常に同じ色を返す', () => {
      expect(seriesColor(13)).toBe(seriesColor(13));
    });

    it('選択の順序に依存しない（prefCode だけで決まる）', () => {
      // 先に大阪を選んでも東京の色は変わらない
      const tokyoFirst = [seriesColor(13), seriesColor(27)];
      const osakaFirst = [seriesColor(27), seriesColor(13)];

      expect(tokyoFirst[0]).toBe(osakaFirst[1]);
      expect(tokyoFirst[1]).toBe(osakaFirst[0]);
    });
  });

  describe('見分けやすさ', () => {
    it('47 都道府県すべてで異なる色になる', () => {
      const colors = new Set(PREF_CODES.map(seriesColor));

      expect(colors.size).toBe(47);
    });

    /**
     * 隣り合うコードだけでなく、任意の 2 県の組み合わせを確かめる。
     * 利用者が選ぶのは連番とは限らないため。
     */
    it('どの 2 県を選んでも色相か明度のどちらかが十分に離れている', () => {
      const tooClose: string[] = [];

      for (const a of PREF_CODES) {
        for (const b of PREF_CODES) {
          if (a >= b) {
            continue;
          }

          const first = parseHsl(seriesColor(a));
          const second = parseHsl(seriesColor(b));
          const hueGap = hueDistance(first.hue, second.hue);
          const lightnessGap = Math.abs(first.lightness - second.lightness);

          // 色相が近い場合は明度で見分けられる必要がある
          if (hueGap < 25 && lightnessGap < 12) {
            tooClose.push(`${String(a)} と ${String(b)}`);
          }
        }
      }

      expect(tooClose).toEqual([]);
    });

    it('彩度は固定で、線の目立ち方がそろう', () => {
      for (const prefCode of PREF_CODES) {
        expect(parseHsl(seriesColor(prefCode)).saturation).toBe(68);
      }
    });

    it('白背景で見える明度の範囲に収まる', () => {
      for (const prefCode of PREF_CODES) {
        const { lightness } = parseHsl(seriesColor(prefCode));

        expect(lightness).toBeGreaterThanOrEqual(30);
        expect(lightness).toBeLessThanOrEqual(68);
      }
    });
  });

  describe('点の形', () => {
    it('prefCode ごとに決まり、選択順に依存しない', () => {
      expect(seriesShape(13)).toBe(seriesShape(13));
    });

    it('用意した形のいずれかを返す', () => {
      for (const prefCode of PREF_CODES) {
        expect(SERIES_SHAPES).toContain(seriesShape(prefCode));
      }
    });

    /**
     * 明度差だけでは同系色の 2 本を見分けにくかったため形も変える。
     * 実際に北海道（1）と東京都（13）が同じ色相で並んだのが発端。
     */
    it('色相が同じになる組み合わせでは形が変わる', () => {
      for (const a of PREF_CODES) {
        for (const b of PREF_CODES) {
          if (a >= b) {
            continue;
          }

          const first = parseHsl(seriesColor(a));
          const second = parseHsl(seriesColor(b));

          if (first.hue === second.hue) {
            expect(seriesShape(a)).not.toBe(seriesShape(b));
          }
        }
      }
    });

    it('北海道と東京都は色相が同じでも形で区別できる', () => {
      expect(parseHsl(seriesColor(1)).hue).toBe(parseHsl(seriesColor(13)).hue);
      expect(seriesShape(1)).not.toBe(seriesShape(13));
    });
  });

  describe('範囲外の入力', () => {
    it('例外を投げずに値を返す', () => {
      expect(() => seriesColor(0)).not.toThrow();
      expect(() => seriesColor(999)).not.toThrow();
      expect(() => seriesShape(0)).not.toThrow();
      expect(() => seriesShape(999)).not.toThrow();
    });
  });
});
