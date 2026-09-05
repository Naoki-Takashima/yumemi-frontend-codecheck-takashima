import { z } from 'zod';

/** 都道府県。`/api/v1/prefectures` が返す 1 件分。 */
export const prefectureSchema = z.object({
  prefCode: z.number().int(),
  prefName: z.string(),
});

export const prefecturesSchema = z.array(prefectureSchema);

/** 人口構成の 1 点。`rate` は総人口以外の系列にのみ存在する。 */
export const populationPointSchema = z.object({
  year: z.number().int(),
  value: z.number(),
  rate: z.number().optional(),
});

/** 1 つの系列（総人口、年少人口 など）。 */
export const populationSeriesSchema = z.object({
  label: z.string(),
  data: z.array(populationPointSchema),
});

/**
 * 1 都道府県分の人口構成。
 * `boundaryYear` より後の年は推計値。
 */
export const populationCompositionSchema = z.object({
  boundaryYear: z.number().int(),
  data: z.array(populationSeriesSchema),
});

export type Prefecture = z.infer<typeof prefectureSchema>;
export type PopulationPoint = z.infer<typeof populationPointSchema>;
export type PopulationSeries = z.infer<typeof populationSeriesSchema>;
export type PopulationComposition = z.infer<typeof populationCompositionSchema>;

/** 画面で切り替える人口の種別。URL のクエリにもこの値をそのまま載せる。 */
export const POPULATION_TYPES = ['total', 'young', 'working', 'elderly'] as const;

export type PopulationType = (typeof POPULATION_TYPES)[number];

export const DEFAULT_POPULATION_TYPE: PopulationType = 'total';

/**
 * 種別と API のラベルの対応。
 * API は日本語のラベルで系列を返すため、URL に日本語を載せずに済むよう変換する。
 */
export const POPULATION_TYPE_LABELS: Record<PopulationType, string> = {
  total: '総人口',
  young: '年少人口',
  working: '生産年齢人口',
  elderly: '老年人口',
};

/** 与えられた文字列が人口種別かどうかを判定する。URL のクエリを検証するのに使う。 */
export function isPopulationType(value: string): value is PopulationType {
  return (POPULATION_TYPES as readonly string[]).includes(value);
}
