/**
 * 都道府県コードから線の見た目（色と点の形）を決める。
 */

/**
 * 30 度ずつの 12 色。
 * 並びは色相環の順ではなく、連続する prefCode が離れた色になるようにしている。
 */
const HUES = [210, 30, 120, 330, 90, 270, 0, 180, 60, 300, 150, 240] as const;

/** 12 色を一巡したら明度を変えてもう一巡する。互いに 12 以上離す。 */
const LIGHTNESS_STEPS = [42, 30, 54, 66] as const;

/** 白背景で線として見やすい彩度に固定する。 */
const SATURATION = 68;

/** Recharts が受け付ける点の形。周回ごとに変えて色以外の手がかりを増やす。 */
export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;

export type SeriesShape = (typeof SERIES_SHAPES)[number];

/** 何周目かを返す（0 始まり）。 */
function cycleOf(prefCode: number): number {
  return Math.floor(Math.max(0, prefCode - 1) / HUES.length);
}

export function seriesColor(prefCode: number): string {
  const index = Math.max(0, prefCode - 1);

  const hue = HUES[index % HUES.length] ?? HUES[0];
  const lightness =
    LIGHTNESS_STEPS[cycleOf(prefCode) % LIGHTNESS_STEPS.length] ?? LIGHTNESS_STEPS[0];

  return `hsl(${String(hue)} ${String(SATURATION)}% ${String(lightness)}%)`;
}

/**
 * 点の形。同じ色相が再登場する周では形も変わるため、
 * 色が近い 2 本でも凡例と線を照らし合わせられる。
 */
export function seriesShape(prefCode: number): SeriesShape {
  return SERIES_SHAPES[cycleOf(prefCode) % SERIES_SHAPES.length] ?? SERIES_SHAPES[0];
}
