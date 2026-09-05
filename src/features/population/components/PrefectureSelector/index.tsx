'use client';

import styles from '@/features/population/components/PrefectureSelector/PrefectureSelector.module.css';
import type { Prefecture } from '@/features/population/types';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';

const PREFECTURE_COUNT = 47;

type PrefectureSelectorProps = {
  prefectures: Prefecture[];
  selectedCodes: number[];
  onToggle: (prefCode: number) => void;
  onClear: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

/**
 * 都道府県のチェックボックス一覧。
 */
export function PrefectureSelector({
  prefectures,
  selectedCodes,
  onToggle,
  onClear,
  isLoading = false,
  isError = false,
  onRetry,
}: PrefectureSelectorProps) {
  const selectedCount = selectedCodes.length;

  return (
    <fieldset className={styles.container}>
      <legend className={styles.legend}>都道府県</legend>

      {!isLoading && !isError && (
        <div className={styles.head}>
          <span className={styles.count} aria-live="polite">
            {selectedCount} 件選択中
          </span>
          <Button onClick={onClear} disabled={selectedCount === 0}>
            すべて解除
          </Button>
        </div>
      )}

      {isError ? (
        <ErrorState
          message="都道府県一覧を取得できませんでした。"
          onRetry={onRetry}
          retryLabel="再読み込み"
        />
      ) : isLoading ? (
        <div className={styles.grid} aria-busy="true" aria-label="都道府県一覧を読み込み中">
          {Array.from({ length: PREFECTURE_COUNT }, (_, index) => (
            <div key={index} className={styles.skeletonItem} />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {prefectures.map((prefecture) => (
            <label key={prefecture.prefCode} className={styles.item}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedCodes.includes(prefecture.prefCode)}
                onChange={() => {
                  onToggle(prefecture.prefCode);
                }}
              />
              <span className={styles.name}>{prefecture.prefName}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
