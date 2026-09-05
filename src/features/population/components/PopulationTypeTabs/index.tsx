'use client';

import { useRef } from 'react';

import styles from '@/features/population/components/PopulationTypeTabs/PopulationTypeTabs.module.css';
import {
  POPULATION_TYPES,
  POPULATION_TYPE_LABELS,
  type PopulationType,
} from '@/features/population/types';

export function tabId(type: PopulationType) {
  return `population-tab-${type}`;
}

export function tabPanelId(type: PopulationType) {
  return `population-tabpanel-${type}`;
}

type PopulationTypeTabsProps = {
  value: PopulationType;
  onChange: (value: PopulationType) => void;
};

/**
 * 人口種別の切り替えタブ。
 */
export function PopulationTypeTabs({ value, onChange }: PopulationTypeTabsProps) {
  const tabRefs = useRef(new Map<PopulationType, HTMLButtonElement>());

  const focusAndSelect = (type: PopulationType) => {
    onChange(type);
    tabRefs.current.get(type)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = POPULATION_TYPES.indexOf(value);
    const lastIndex = POPULATION_TYPES.length - 1;

    const nextIndex = (() => {
      switch (event.key) {
        case 'ArrowRight':
          return currentIndex === lastIndex ? 0 : currentIndex + 1;
        case 'ArrowLeft':
          return currentIndex === 0 ? lastIndex : currentIndex - 1;
        case 'Home':
          return 0;
        case 'End':
          return lastIndex;
        default:
          return null;
      }
    })();

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();

    const nextType = POPULATION_TYPES[nextIndex];
    if (nextType) {
      focusAndSelect(nextType);
    }
  };

  return (
    <div className={styles.tablist} role="tablist" aria-label="人口種別">
      {POPULATION_TYPES.map((type) => {
        const isSelected = type === value;

        return (
          <button
            key={type}
            ref={(element) => {
              if (element) {
                tabRefs.current.set(type, element);
              } else {
                tabRefs.current.delete(type);
              }
            }}
            type="button"
            role="tab"
            id={tabId(type)}
            className={styles.tab}
            aria-selected={isSelected}
            aria-controls={tabPanelId(type)}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => {
              onChange(type);
            }}
            onKeyDown={handleKeyDown}
          >
            {POPULATION_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
