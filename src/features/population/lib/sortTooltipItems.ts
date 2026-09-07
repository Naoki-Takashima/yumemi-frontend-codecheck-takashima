type TooltipItem = {
  value?: unknown;
};

/**
 * ツールチップの行を、その年の人口数の降順に並べる。
 */
export function sortByPopulationDesc<T extends TooltipItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const left = toSortKey(a.value);
    const right = toSortKey(b.value);

    if (left === right) {
      return 0;
    }

    return left > right ? -1 : 1;
  });
}

function toSortKey(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}
