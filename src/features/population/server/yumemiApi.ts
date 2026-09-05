import 'server-only';

import { z } from 'zod';

import {
  type PopulationComposition,
  type Prefecture,
  populationCompositionSchema,
  prefecturesSchema,
} from '@/features/population/types';

/** フロントエンドコーディング試験 APIへのアクセス */

const BASE_URL = 'https://frontend-engineer-codecheck-api.mirai.yumemi.io';

/** 都道府県一覧は変化しないため長めに保持する（秒）。 */
const PREFECTURES_REVALIDATE_SECONDS = 60 * 60 * 24;

/** 人口構成は年次データのため、そこそこ長く保持する（秒）。 */
const POPULATION_REVALIDATE_SECONDS = 60 * 60;

/** 上流 API が 2xx 以外を返したことを表す。 */
export class UpstreamApiError extends Error {
  constructor(readonly status: number) {
    super(`上流 API が ${status} を返しました`);
    this.name = 'UpstreamApiError';
  }
}

export class UpstreamSchemaError extends Error {
  constructor(readonly issues: unknown) {
    super('上流 API のレスポンスが想定した形式ではありません');
    this.name = 'UpstreamSchemaError';
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('環境変数 YUMEMI_API_KEY が設定されていません');
    this.name = 'MissingApiKeyError';
  }
}


function getApiKey(): string {
  const apiKey = process.env.YUMEMI_API_KEY;

  if (apiKey === undefined || apiKey === '') {
    throw new MissingApiKeyError();
  }

  return apiKey;
}

const envelopeSchema = z.object({
  message: z.string().nullable(),
  result: z.unknown(),
});

async function requestUpstream<T>(
  path: string,
  options: {
    schema: z.ZodType<T>;
    searchParams?: Record<string, string>;
    revalidateSeconds: number;
  },
): Promise<T> {
  const url = new URL(path, BASE_URL);

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { 'X-API-KEY': getApiKey() },
    next: { revalidate: options.revalidateSeconds },
  });

  if (!response.ok) {
    throw new UpstreamApiError(response.status);
  }

  const envelope = envelopeSchema.safeParse(await response.json());

  if (!envelope.success) {
    throw new UpstreamSchemaError(envelope.error.issues);
  }

  const parsed = options.schema.safeParse(envelope.data.result);

  if (!parsed.success) {
    throw new UpstreamSchemaError(parsed.error.issues);
  }

  return parsed.data;
}

/** 都道府県一覧を取得する。 */
export function fetchPrefectures(): Promise<Prefecture[]> {
  return requestUpstream('/api/v1/prefectures', {
    schema: prefecturesSchema,
    revalidateSeconds: PREFECTURES_REVALIDATE_SECONDS,
  });
}

/** 指定した都道府県の人口構成を取得する */
export function fetchPopulationComposition(prefCode: number): Promise<PopulationComposition> {
  return requestUpstream('/api/v1/population/composition/perYear', {
    schema: populationCompositionSchema,
    searchParams: { prefCode: String(prefCode) },
    revalidateSeconds: POPULATION_REVALIDATE_SECONDS,
  });
}
