'use client';

import { PopulationChart } from '@/features/population/components/PopulationChart';
import styles from '@/features/population/components/PopulationDashboard/PopulationDashboard.module.css';
import {
  PopulationTypeTabs,
  tabId,
  tabPanelId,
} from '@/features/population/components/PopulationTypeTabs';
import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import { useChartSelection } from '@/features/population/hooks/useChartSelection';
import { usePopulations } from '@/features/population/hooks/usePopulations';
import { usePrefectures } from '@/features/population/hooks/usePrefectures';
import type { Prefecture } from '@/features/population/types';
import { ErrorState } from '@/shared/components/ErrorState';
import { Spinner } from '@/shared/components/Spinner';

/**
 * 都道府県の選択、人口種別の切り替え、グラフ表示をまとめる画面。
 */
export function PopulationDashboard() {
  const prefecturesQuery = usePrefectures();
  const selection = useChartSelection();

  const prefectures = prefecturesQuery.data ?? [];

  /**
   * 選択された都道府県を URL に書かれた順で取り出す。
   */
  const prefectureByCode = new Map(
    prefectures.map((prefecture) => [prefecture.prefCode, prefecture]),
  );
  const selectedPrefectures = selection.prefCodes
    .map((prefCode) => prefectureByCode.get(prefCode))
    .filter((prefecture): prefecture is Prefecture => prefecture !== undefined);

  const populations = usePopulations(selectedPrefectures);

  return (
    <div className={styles.dashboard}>
      <PrefectureSelector
        prefectures={prefectures}
        selectedCodes={selection.prefCodes}
        onToggle={selection.togglePrefecture}
        onClear={selection.clearPrefectures}
        isLoading={prefecturesQuery.isPending}
        isError={prefecturesQuery.isError}
        onRetry={() => {
          void prefecturesQuery.refetch();
        }}
      />

      <section className={styles.chartSection}>
        <PopulationTypeTabs value={selection.type} onChange={selection.setType} />

        <div
          className={styles.tabpanel}
          role="tabpanel"
          id={tabPanelId(selection.type)}
          aria-labelledby={tabId(selection.type)}
          tabIndex={0}
        >
          {populations.failedPrefNames.length > 0 && (
            <ErrorState
              message={`${populations.failedPrefNames.join('、')}のデータを取得できませんでした。`}
              onRetry={populations.retryFailed}
            />
          )}

          {selection.prefCodes.length === 0 ? (
            <p className={styles.empty}>都道府県を選択すると、人口の推移を表示します。</p>
          ) : populations.isEmpty && populations.isFetching ? (
            <p className={styles.loading}>
              <Spinner />
              人口データを読み込んでいます
            </p>
          ) : (
            <PopulationChart entries={populations.entries} type={selection.type} />
          )}
        </div>
      </section>
    </div>
  );
}
