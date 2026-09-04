/**
 * 人口構成のテスト用データ。
 *
 * 実 API（GET /api/v1/population/composition/perYear）の形をそのまま再現している。
 * - 1960〜2045 年の 5 年刻み、計 18 点
 * - 系列は「総人口 / 年少人口 / 生産年齢人口 / 老年人口」の 4 本
 * - `rate` を持つのは総人口以外の 3 系列のみ
 * - `boundaryYear` は 2020。これより後は推計値
 */

/** 実 API が返す年の並び。1960〜2045 年の 5 年刻み。 */
export const POPULATION_YEARS = [
  1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035,
  2040, 2045,
] as const;

/** これより後の年は推計値。 */
export const BOUNDARY_YEAR = 2020;

export const POPULATION_LABELS = ['総人口', '年少人口', '生産年齢人口', '老年人口'] as const;

type PopulationPointFixture = { year: number; value: number; rate?: number };

/**
 * prefCode から決定的に人口構成データを生成する。
 *
 * 総人口は prefCode に比例して増加させ、年齢構成は少子高齢化の傾向を持たせている。
 * 3 系列の合計が総人口と厳密に一致するよう、生産年齢人口を差分で求めている。
 */
export function createPopulationFixture(prefCode: number) {
  const total: PopulationPointFixture[] = [];
  const young: PopulationPointFixture[] = [];
  const working: PopulationPointFixture[] = [];
  const elderly: PopulationPointFixture[] = [];

  POPULATION_YEARS.forEach((year, index) => {
    const totalValue = prefCode * 100_000 + index * 50_000;

    const youngRatio = 0.33 - index * 0.012;
    const elderlyRatio = 0.05 + index * 0.015;

    const youngValue = Math.round(totalValue * youngRatio);
    const elderlyValue = Math.round(totalValue * elderlyRatio);
    // 端数のずれを吸収し、3 系列の合計を総人口に一致させる
    const workingValue = totalValue - youngValue - elderlyValue;

    const toRate = (value: number) => Math.round((value / totalValue) * 10_000) / 100;

    total.push({ year, value: totalValue });
    young.push({ year, value: youngValue, rate: toRate(youngValue) });
    working.push({ year, value: workingValue, rate: toRate(workingValue) });
    elderly.push({ year, value: elderlyValue, rate: toRate(elderlyValue) });
  });

  return {
    boundaryYear: BOUNDARY_YEAR,
    data: [
      { label: '総人口', data: total },
      { label: '年少人口', data: young },
      { label: '生産年齢人口', data: working },
      { label: '老年人口', data: elderly },
    ],
  };
}

/** 東京都（prefCode: 13）の人口構成。単発のテストで使う既定のデータ。 */
export const populationFixture = createPopulationFixture(13);
