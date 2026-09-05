export const MIN_PREF_CODE = 1;
export const MAX_PREF_CODE = 47;

/** 都道府県コードとして妥当な文字列だけを数値に変換する。妥当でなければ `null` */
export function parsePrefCode(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const value = Number(raw);

  return value >= MIN_PREF_CODE && value <= MAX_PREF_CODE ? value : null;
}
