import { describe, expect, it } from 'vitest';

import { SERIES_SHAPES, seriesColor, seriesShape } from '@/features/population/lib/seriesColor';

const PREF_CODES = Array.from({ length: 47 }, (_, index) => index + 1);

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

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = l - chroma / 2;

  const table = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];
  const base = table[Math.floor(sector) % 6] ?? [0, 0, 0];

  return base.map((value) => value + offset);
}

function relativeLuminance(color: string) {
  const { hue, saturation, lightness } = parseHsl(color);
  const [red = 0, green = 0, blue = 0] = hslToRgb(hue, saturation, lightness);
  const toLinear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

function contrastRatio(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const WHITE_LUMINANCE = 1;

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
    it('どの 2 県を選んでも色相か明るさのどちらかが十分に離れている', () => {
      const tooClose: string[] = [];

      for (const a of PREF_CODES) {
        for (const b of PREF_CODES) {
          if (a >= b) {
            continue;
          }

          const first = seriesColor(a);
          const second = seriesColor(b);
          const hueGap = hueDistance(parseHsl(first).hue, parseHsl(second).hue);
          const gap = contrastRatio(relativeLuminance(first), relativeLuminance(second));

          // 色相が近い場合は明るさの差で見分けられる必要がある。
          // 明度の数値差ではなく輝度比で見る。暗い側では
          // 同じ明度差でも見え方の差がずっと小さくなるため
          if (hueGap < 25 && gap < 1.5) {
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

    /**
     * 図形として認識できる最低線（WCAG 1.4.11）。
     * 明度を色相によらず固定していた頃は 47 色中 20 色がここを下回り、
     * とくに黄（hsl 60）は 1.35:1 で白地にほとんど見えなかった。
     */
    it('47 都道府県すべてが白背景に対して 3:1 以上ある', () => {
      const failures: string[] = [];

      for (const prefCode of PREF_CODES) {
        const color = seriesColor(prefCode);
        const ratio = contrastRatio(relativeLuminance(color), WHITE_LUMINANCE);

        if (ratio < 3) {
          failures.push(`${String(prefCode)}: ${color} = ${ratio.toFixed(2)}:1`);
        }
      }

      expect(failures).toEqual([]);
    });

    it('色相が読み取れる範囲まで暗くするに留める', () => {
      for (const prefCode of PREF_CODES) {
        expect(parseHsl(seriesColor(prefCode)).lightness).toBeGreaterThanOrEqual(12);
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
