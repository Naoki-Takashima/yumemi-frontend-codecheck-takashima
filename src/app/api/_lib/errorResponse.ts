import { NextResponse } from 'next/server';

import type { PopulationApiErrorCode } from '@/features/population/errors';
import {
  MissingApiKeyError,
  UpstreamApiError,
  UpstreamSchemaError,
  UpstreamUnreachableError,
} from '@/features/population/server/yumemiApi';
import type { ApiErrorBody } from '@/shared/api/contract';

/** 例外をクライアント向けのレスポンスに変換する。 */

type PopulationErrorBody = ApiErrorBody<PopulationApiErrorCode>;

const RETRYABLE_MESSAGE = 'データを取得できませんでした。時間をおいて再度お試しください。';

export function errorResponse(
  code: PopulationApiErrorCode,
  message: string,
  status: number,
): NextResponse<PopulationErrorBody> {
  return NextResponse.json<PopulationErrorBody>({ error: { code, message } }, { status });
}

export function toErrorResponse(error: unknown): NextResponse<PopulationErrorBody> {
  if (error instanceof MissingApiKeyError) {
    console.error('[api] API キーが未設定です', error);
    return errorResponse('UPSTREAM_UNAVAILABLE', RETRYABLE_MESSAGE, 503);
  }

  if (error instanceof UpstreamUnreachableError) {
    console.error('[api] 上流 API へ到達できませんでした', error.cause);
    return errorResponse('UPSTREAM_UNAVAILABLE', RETRYABLE_MESSAGE, 503);
  }

  if (error instanceof UpstreamSchemaError) {
    console.error('[api] 上流 API のレスポンスが想定と異なります', error.issues);
    return errorResponse('UPSTREAM_ERROR', RETRYABLE_MESSAGE, 502);
  }

  if (error instanceof UpstreamApiError) {
    console.error(`[api] 上流 API がエラーを返しました status=${error.status}`);
    return errorResponse('UPSTREAM_ERROR', RETRYABLE_MESSAGE, 502);
  }

  console.error('[api] 想定外のエラー', error);

  return errorResponse('INTERNAL_ERROR', 'データを取得できませんでした。', 500);
}
