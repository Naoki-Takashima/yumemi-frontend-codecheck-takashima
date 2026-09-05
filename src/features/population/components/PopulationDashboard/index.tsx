'use client';

import { useState } from 'react';

import { PopulationChart } from '@/features/population/components/PopulationChart';
import styles from '@/features/population/components/PopulationDashboard/PopulationDashboard.module.css';
import {
  PopulationTypeTabs,
  tabId,
  tabPanelId,
} from '@/features/population/components/PopulationTypeTabs';
import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import { usePopulations } from '@/features/population/hooks/usePopulations';
import { usePrefectures } from '@/features/population/hooks/usePrefectures';
import { DEFAULT_POPULATION_TYPE, type PopulationType } from '@/features/population/types';
import { ErrorState } from '@/shared/components/ErrorState';
import { Spinner } from '@/shared/components/Spinner';

/**
 * 都道府県の選択、人口種別の切り替え、グラフ表示をまとめる画面。
 */
export function PopulationDashboard() {
  const prefecturesQuery = usePrefectures();

  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [populationType, setPopulationType] = useState<PopulationType>(DEFAULT_POPULATION_TYPE);

  const prefectures = prefecturesQuery.data ?? [];
  const selectedPrefectures = prefectures.filter((prefecture) =>
    selectedCodes.includes(prefecture.prefCode),
  );

  const populations = usePopulations(selectedPrefectures);

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
        prefectures={prefectures}
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
          {populations.failedPrefNames.length > 0 && (
            <ErrorState
              message={`${populations.failedPrefNames.join('、')}のデータを取得できませんでした。`}
              onRetry={populations.retryFailed}
            />
          )}

          {selectedCodes.length === 0 ? (
            <p className={styles.empty}>都道府県を選択すると、人口の推移を表示します。</p>
          ) : populations.isEmpty && populations.isFetching ? (
            <p className={styles.loading}>
              <Spinner />
              人口データを読み込んでいます
            </p>
          ) : (
            <PopulationChart entries={populations.entries} type={populationType} />
          )}
        </div>
      </section>
    </div>
  );
}
