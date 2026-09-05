import type { PopulationComposition, Prefecture } from '@/features/population/types';
import { fetchJson } from '@/shared/api/client/fetchJson';

export async function getPrefectures(): Promise<Prefecture[]> {
  const body = await fetchJson<{ result: Prefecture[] }>('/api/prefectures');

  return body.result;
}

export async function getPopulationComposition(prefCode: number): Promise<PopulationComposition> {
  const body = await fetchJson<{ result: PopulationComposition }>(
    `/api/population?prefCode=${String(prefCode)}`,
  );

  return body.result;
}
