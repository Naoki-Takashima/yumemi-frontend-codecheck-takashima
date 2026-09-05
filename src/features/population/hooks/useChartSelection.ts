'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { MAX_SELECTABLE_PREFECTURES } from '@/features/population/constants';
import {
  parseSelection,
  serializeSelection,
  type ChartSelection,
} from '@/features/population/lib/searchParams';
import type { PopulationType } from '@/features/population/types';

export type UseChartSelectionResult = ChartSelection & {
  togglePrefecture: (prefCode: number) => void;
  clearPrefectures: () => void;
  setType: (type: PopulationType) => void;
  isFull: boolean;
};

/**
 * 選択状態を URL のクエリで持つ。
 */
export function useChartSelection(): UseChartSelectionResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selection = parseSelection(new URLSearchParams(searchParams.toString()));

  const apply = useCallback(
    (next: ChartSelection) => {
      const query = serializeSelection(next);

      router.replace(query === '' ? pathname : `${pathname}?${query}`, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  const togglePrefecture = useCallback(
    (prefCode: number) => {
      const current = selection.prefCodes;

      if (current.includes(prefCode)) {
        apply({ ...selection, prefCodes: current.filter((code) => code !== prefCode) });
        return;
      }

      if (current.length >= MAX_SELECTABLE_PREFECTURES) {
        return;
      }

      apply({ ...selection, prefCodes: [...current, prefCode] });
    },
    [apply, selection],
  );

  const clearPrefectures = useCallback(() => {
    apply({ ...selection, prefCodes: [] });
  }, [apply, selection]);

  const setType = useCallback(
    (type: PopulationType) => {
      apply({ ...selection, type });
    },
    [apply, selection],
  );

  return {
    ...selection,
    togglePrefecture,
    clearPrefectures,
    setType,
    isFull: selection.prefCodes.length >= MAX_SELECTABLE_PREFECTURES,
  };
}
