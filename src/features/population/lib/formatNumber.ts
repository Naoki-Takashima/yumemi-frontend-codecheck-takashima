/**
 * 人口の数値を画面向けに整える。
 */

const numberFormatter = new Intl.NumberFormat('ja-JP');

/** ツールチップ用。桁区切りを入れた正確な値。 */
export function formatPopulation(value: number): string {
  return `${numberFormatter.format(value)} 人`;
}

const MAN = 10_000;
const OKU = 100_000_000;

/**
 * 目盛り用の短縮表記。
 */
export function formatPopulationShort(value: number): string {
  if (value === 0) {
    return '0';
  }

  const abs = Math.abs(value);

  if (abs >= OKU) {
    return `${trimZero(value / OKU)}億`;
  }

  if (abs >= MAN) {
    return `${trimZero(value / MAN)}万`;
  }

  return numberFormatter.format(value);
}

/** 小数第 1 位まで残しつつ、`.0` は落とす。 */
function trimZero(value: number): string {
  return String(Math.round(value * 10) / 10);
}
