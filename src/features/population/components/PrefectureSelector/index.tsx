'use client';

import styles from '@/features/population/components/PrefectureSelector/PrefectureSelector.module.css';
import { MAX_SELECTABLE_PREFECTURES } from '@/features/population/constants';
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
  maxSelectable?: number;
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
  maxSelectable = MAX_SELECTABLE_PREFECTURES,
}: PrefectureSelectorProps) {
  const selectedCount = selectedCodes.length;
  const isFull = selectedCount >= maxSelectable;

  return (
    <fieldset className={styles.container}>
      <legend className={styles.legend}>都道府県</legend>

      {!isLoading && !isError && (
        <div className={styles.head}>
          <span className={styles.count} aria-live="polite">
            {selectedCount} / {maxSelectable} 件選択中
            {isFull && (
              <span className={styles.limitNote}>
                （他の都道府県を選ぶには、いずれかの選択を外してください）
              </span>
            )}
          </span>
          <Button variant="link" onClick={onClear} disabled={selectedCount === 0}>
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
          {prefectures.map((prefecture) => {
            const isSelected = selectedCodes.includes(prefecture.prefCode);
            const isDisabled = isFull && !isSelected;

            return (
              <label
                key={prefecture.prefCode}
                className={styles.item}
                data-disabled={isDisabled || undefined}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => {
                    onToggle(prefecture.prefCode);
                  }}
                />
                <span className={styles.name}>{prefecture.prefName}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
