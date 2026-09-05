import {
  POPULATION_TYPE_LABELS,
  type PopulationComposition,
  type PopulationType,
} from '@/features/population/types';

export type ChartRow = {
  year: number;
} & Record<string, number | undefined>;

export type ChartData = {
  rows: ChartRow[];
  prefNames: string[];
  boundaryYear: number | null;
};

export type PopulationEntry = {
  prefCode: number;
  prefName: string;
  composition: PopulationComposition;
};

/**
 * 複数の都道府県の人口構成を、グラフが扱える 1 つの表に変換する。
 */
export function toChartSeries(entries: PopulationEntry[], type: PopulationType): ChartData {
  const label = POPULATION_TYPE_LABELS[type];

  const valuesByPref = new Map<string, Map<number, number>>();
  const years = new Set<number>();
  const boundaryYears: number[] = [];

  for (const entry of entries) {
    const series = entry.composition.data.find((candidate) => candidate.label === label);

    if (!series) {
      continue;
    }

    const valuesByYear = new Map<number, number>();
    for (const point of series.data) {
      valuesByYear.set(point.year, point.value);
      years.add(point.year);
    }

    valuesByPref.set(entry.prefName, valuesByYear);
    boundaryYears.push(entry.composition.boundaryYear);
  }

  const prefNames = [...valuesByPref.keys()];
  const sortedYears = [...years].sort((a, b) => a - b);

  const rows: ChartRow[] = sortedYears.map((year) => {
    const row: ChartRow = { year };

    for (const prefName of prefNames) {
      row[prefName] = valuesByPref.get(prefName)?.get(year);
    }

    return row;
  });

  return {
    rows,
    prefNames,
    boundaryYear: boundaryYears.length > 0 ? Math.min(...boundaryYears) : null,
  };
}
