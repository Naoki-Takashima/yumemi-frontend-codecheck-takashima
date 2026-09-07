/**
 * 都道府県コードから線の見た目（色と点の形）を決める。
 */

/**
 * 30 度ずつの 12 色。
 * 並びは色相環の順ではなく、連続する prefCode が離れた色になるようにしている。
 */
const HUES = [210, 30, 120, 330, 90, 270, 0, 180, 60, 300, 150, 240] as const;

/** 白背景で線として見やすい彩度に固定する。 */
const SATURATION = 68;

/** 12 色を一巡したら明度を変えてもう一巡する。47 県を覆うのに 4 周必要。 */
const CYCLE_COUNT = 4;

/** これより暗くすると色相が読み取れなくなる。 */
const MIN_LIGHTNESS = 12;

const BOTTOM_RATIO = 0.35;

/** 白背景に対して図形に求められるコントラスト比（WCAG 1.4.11）。 */
const MIN_CONTRAST_ON_WHITE = 3;

/** Recharts が受け付ける点の形。周回ごとに変えて色以外の手がかりを増やす。 */
export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;

export type SeriesShape = (typeof SERIES_SHAPES)[number];

/** hsl を 0〜1 の RGB に変換する。 */
function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = l - chroma / 2;

  const table: [number, number, number][] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];
  const [red = 0, green = 0, blue = 0] = table[Math.floor(sector) % 6] ?? [];

  return [red + offset, green + offset, blue + offset];
}

/** WCAG の相対輝度。 */
function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const toLinear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

function luminanceOf(hue: number, lightness: number): number {
  return relativeLuminance(hslToRgb(hue, SATURATION, lightness));
}

function contrastOnWhite(hue: number, lightness: number): number {
  return 1.05 / (luminanceOf(hue, lightness) + 0.05);
}

/**
 * 色相ごとに使える明度の段を作る。
 */
function lightnessScale(hue: number): number[] {
  let top = 70;
  while (top > MIN_LIGHTNESS && contrastOnWhite(hue, top) < MIN_CONTRAST_ON_WHITE) {
    top -= 1;
  }

  const bottom = Math.max(MIN_LIGHTNESS, Math.round(top * BOTTOM_RATIO));
  const topLuminance = luminanceOf(hue, top) + 0.05;
  const bottomLuminance = luminanceOf(hue, bottom) + 0.05;

  return Array.from({ length: CYCLE_COUNT }, (_, cycle) => {
    const target =
      topLuminance * Math.pow(bottomLuminance / topLuminance, cycle / (CYCLE_COUNT - 1));

    let best = top;
    let bestDistance = Infinity;

    for (let lightness = bottom; lightness <= top; lightness += 1) {
      const distance = Math.abs(luminanceOf(hue, lightness) + 0.05 - target);

      if (distance < bestDistance) {
        bestDistance = distance;
        best = lightness;
      }
    }

    return best;
  });
}

/** 色相は 12 通りしかないので、求めた段は使い回す。 */
const scaleCache = new Map<number, number[]>();

function scaleFor(hue: number): number[] {
  const cached = scaleCache.get(hue);

  if (cached) {
    return cached;
  }

  const scale = lightnessScale(hue);
  scaleCache.set(hue, scale);

  return scale;
}

/** 何周目かを返す（0 始まり）。 */
function cycleOf(prefCode: number): number {
  return Math.floor(Math.max(0, prefCode - 1) / HUES.length);
}

export function seriesColor(prefCode: number): string {
  const index = Math.max(0, prefCode - 1);

  const hue = HUES[index % HUES.length] ?? HUES[0];
  const scale = scaleFor(hue);
  const lightness = scale[cycleOf(prefCode) % CYCLE_COUNT] ?? scale[0] ?? MIN_LIGHTNESS;

  return `hsl(${String(hue)} ${String(SATURATION)}% ${String(lightness)}%)`;
}

/**
 * 点の形。同じ色相が再登場する周では形も変わるため、
 * 色が近い 2 本でも凡例と線を照らし合わせられる。
 */
export function seriesShape(prefCode: number): SeriesShape {
  return SERIES_SHAPES[cycleOf(prefCode) % SERIES_SHAPES.length] ?? SERIES_SHAPES[0];
}
