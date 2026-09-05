'use client';

import { useQueries } from '@tanstack/react-query';

import { getPopulationComposition } from '@/features/population/api';
import type { PopulationEntry } from '@/features/population/lib/toChartSeries';
import type { Prefecture } from '@/features/population/types';

export function populationQueryKey(prefCode: number) {
  return ['population', prefCode] as const;
}

export type UsePopulationsResult = {
  entries: PopulationEntry[];
  failedPrefNames: string[];
  isFetching: boolean;
  isEmpty: boolean;
  retryFailed: () => void;
};

/**
 * 選択された都道府県の人口構成をまとめて取得する。
 */
export function usePopulations(prefectures: Prefecture[]): UsePopulationsResult {
  const results = useQueries({
    queries: prefectures.map((prefecture) => ({
      queryKey: populationQueryKey(prefecture.prefCode),
      queryFn: () => getPopulationComposition(prefecture.prefCode),
    })),
  });

  const entries: PopulationEntry[] = [];
  const failedPrefNames: string[] = [];

  prefectures.forEach((prefecture, index) => {
    const result = results[index];

    if (!result) {
      return;
    }

    if (result.data) {
      entries.push({
        prefCode: prefecture.prefCode,
        prefName: prefecture.prefName,
        composition: result.data,
      });
      return;
    }

    if (result.isError) {
      failedPrefNames.push(prefecture.prefName);
    }
  });

  return {
    entries,
    failedPrefNames,
    isFetching: results.some((result) => result.isPending),
    isEmpty: prefectures.length > 0 && entries.length === 0,
    retryFailed: () => {
      for (const result of results) {
        if (result.isError) {
          void result.refetch();
        }
      }
    },
  };
}
