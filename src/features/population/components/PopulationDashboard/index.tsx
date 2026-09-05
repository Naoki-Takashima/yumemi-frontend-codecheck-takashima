'use client';

import { useState } from 'react';

import styles from '@/features/population/components/PopulationDashboard/PopulationDashboard.module.css';
import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import {
  PopulationTypeTabs,
  tabId,
  tabPanelId,
} from '@/features/population/components/PopulationTypeTabs';
import { usePrefectures } from '@/features/population/hooks/usePrefectures';
import { DEFAULT_POPULATION_TYPE, type PopulationType } from '@/features/population/types';

/**
 * 都道府県の選択とグラフ表示をまとめる画面。
 */
export function PopulationDashboard() {
  const prefecturesQuery = usePrefectures();

  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [populationType, setPopulationType] = useState<PopulationType>(DEFAULT_POPULATION_TYPE);

  const toggle = (prefCode: number) => {
    setSelectedCodes((current) =>
      current.includes(prefCode)
        ? current.filter((code) => code !== prefCode)
        : [...current, prefCode],
    );
  };

  const hasSelection = selectedCodes.length > 0;

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

      <section className={styles.chartSection}>
        <PopulationTypeTabs value={populationType} onChange={setPopulationType} />

        <div
          className={styles.tabpanel}
          role="tabpanel"
          id={tabPanelId(populationType)}
          aria-labelledby={tabId(populationType)}
          tabIndex={0}
        >
          {hasSelection ? (
            <p className={styles.empty}>グラフは後続の対応で表示します。</p>
          ) : (
            <p className={styles.empty}>都道府県を選択すると、人口の推移を表示します。</p>
          )}
        </div>
      </section>
    </div>
  );
}
