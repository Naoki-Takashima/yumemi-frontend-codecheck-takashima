import { NextResponse } from 'next/server';

import { toErrorResponse } from '@/app/api/_lib/errorResponse';
import { fetchPrefectures } from '@/features/population/server/yumemiApi';

/** 都道府県一覧を返す BFF。 */

// ビルド時に実行されないようにする。API キーを持たない環境でもビルドを通すため。
export const dynamic = 'force-dynamic';

/** 都道府県一覧は変化しないため、長めにキャッシュさせる。 */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';

export async function GET() {
  try {
    const prefectures = await fetchPrefectures();

    return NextResponse.json(
      { result: prefectures },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
