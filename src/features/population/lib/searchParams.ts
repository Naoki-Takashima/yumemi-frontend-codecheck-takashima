import { MAX_SELECTABLE_PREFECTURES } from '@/features/population/constants';
import { parsePrefCode } from '@/features/population/prefCode';
import {
  DEFAULT_POPULATION_TYPE,
  isPopulationType,
  type PopulationType,
} from '@/features/population/types';

/**
 * 選択状態と URL のクエリの相互変換。
 */

export const PREF_CODES_PARAM = 'prefCodes';
export const POPULATION_TYPE_PARAM = 'type';

export type ChartSelection = {
  prefCodes: number[];
  type: PopulationType;
};

export const EMPTY_SELECTION: ChartSelection = {
  prefCodes: [],
  type: DEFAULT_POPULATION_TYPE,
};

/**
 * クエリを選択状態に変換する。
 */
export function parseSelection(params: URLSearchParams): ChartSelection {
  const raw = params.get(PREF_CODES_PARAM) ?? '';

  const prefCodes: number[] = [];
  const seen = new Set<number>();

  for (const part of raw.split(',')) {
    const prefCode = parsePrefCode(part);

    if (prefCode === null || seen.has(prefCode)) {
      continue;
    }

    seen.add(prefCode);
    prefCodes.push(prefCode);

    if (prefCodes.length >= MAX_SELECTABLE_PREFECTURES) {
      break;
    }
  }

  const rawType = params.get(POPULATION_TYPE_PARAM);

  return {
    prefCodes,
    type: rawType !== null && isPopulationType(rawType) ? rawType : DEFAULT_POPULATION_TYPE,
  };
}

/**
 * 選択状態をクエリ文字列に変換する。
 */
export function serializeSelection(selection: ChartSelection): string {
  const params = new URLSearchParams();

  if (selection.prefCodes.length > 0) {
    params.set(PREF_CODES_PARAM, selection.prefCodes.join(','));
  }

  if (selection.type !== DEFAULT_POPULATION_TYPE) {
    params.set(POPULATION_TYPE_PARAM, selection.type);
  }

  return params.toString();
}
