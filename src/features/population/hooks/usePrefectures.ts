'use client';

import { useQuery } from '@tanstack/react-query';

import { getPrefectures } from '@/features/population/api';

export const prefecturesQueryKey = ['prefectures'] as const;

/**
 * 都道府県一覧を取得する。
 * 47 件は変化しないため、一度取得したら再取得しない
 */
export function usePrefectures() {
  return useQuery({
    queryKey: prefecturesQueryKey,
    queryFn: getPrefectures,
  });
}
