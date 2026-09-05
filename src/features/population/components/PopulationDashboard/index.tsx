'use client';

import { useState } from 'react';

import styles from '@/features/population/components/PopulationDashboard/PopulationDashboard.module.css';
import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import { usePrefectures } from '@/features/population/hooks/usePrefectures';

/**
 * 都道府県の選択とグラフ表示をまとめる画面。
 */
export function PopulationDashboard() {
  const prefecturesQuery = usePrefectures();
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);

  const toggle = (prefCode: number) => {
    setSelectedCodes((current) =>
      current.includes(prefCode)
        ? current.filter((code) => code !== prefCode)
        : [...current, prefCode],
    );
  };

  return (
    <div className={styles.dashboard}>
      <PrefectureSelector
        prefectures={prefecturesQuery.data ?? []}
        selectedCodes={selectedCodes}
        onToggle={toggle}
        onClear={() => {
          setSelectedCodes([]);
        }}
        isLoading={prefecturesQuery.isPending}
        isError={prefecturesQuery.isError}
        onRetry={() => {
          void prefecturesQuery.refetch();
        }}
      />
    </div>
  );
}
