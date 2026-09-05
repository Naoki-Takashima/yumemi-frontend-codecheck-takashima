import type { ApiErrorBody } from '@/shared/api/contract';

/**ブラウザから自前の BFF を叩くためのラッパー。 */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_ERROR_MESSAGE = 'データを取得できませんでした。';

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new Error(`fetchJson は /api/ で始まる相対パスのみを受け付けます: ${path}`);
  }

  const response = await fetch(path, init);

  if (!response.ok) {
    throw new ApiError(response.status, ...(await readErrorBody(response)));
  }

  return (await response.json()) as T;
}

async function readErrorBody(response: Response): Promise<[string, string]> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody<string>>;

    if (body.error) {
      return [body.error.code, body.error.message];
    }
  } catch {
    // JSON として読めない場合は既定の文言を使う
  }

  return [UNKNOWN_ERROR_CODE, DEFAULT_ERROR_MESSAGE];
}
