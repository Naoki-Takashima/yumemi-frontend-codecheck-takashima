import { type NextRequest, NextResponse } from 'next/server';

import { errorResponse, toErrorResponse } from '@/app/api/_lib/errorResponse';
import { MAX_PREF_CODE, MIN_PREF_CODE, parsePrefCode } from '@/features/population/prefCode';
import { fetchPopulationComposition } from '@/features/population/server/yumemiApi';

/** 指定した都道府県の人口構成を返す BFF。 */

// ビルド時に実行されないようにする。API キーを持たない環境でもビルドを通すため。
export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(request: NextRequest) {
  const prefCode = parsePrefCode(request.nextUrl.searchParams.get('prefCode'));

  if (prefCode === null) {
    return errorResponse(
      'INVALID_PREF_CODE',
      `prefCode には ${MIN_PREF_CODE} 以上 ${MAX_PREF_CODE} 以下の整数を指定してください。`,
      400,
    );
  }

  try {
    const composition = await fetchPopulationComposition(prefCode);

    return NextResponse.json(
      { result: composition },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
