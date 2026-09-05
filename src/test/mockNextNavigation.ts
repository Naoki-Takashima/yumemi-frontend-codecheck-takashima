import { useSyncExternalStore } from 'react';
import { vi } from 'vitest';

/**
 * `next/navigation` をテスト用に差し替える。
 */

let pathname = '/';
let search = '';

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const replaceCalls: string[] = [];

export const nextNavigationMock = {
  reset(initialQuery = '') {
    pathname = '/';
    search = initialQuery;
    replaceCalls.length = 0;
    notify();
  },

  get search() {
    return search;
  },

  get url() {
    return search === '' ? pathname : `${pathname}?${search}`;
  },
};

export function createNextNavigationMock() {
  return {
    useRouter: () => ({
      replace: (href: string) => {
        replaceCalls.push(href);
        const [nextPathname, nextSearch = ''] = href.split('?');
        pathname = nextPathname ?? '/';
        search = nextSearch;
        notify();
      },
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),

    usePathname: () =>
      useSyncExternalStore(
        subscribe,
        () => pathname,
        () => pathname,
      ),

    useSearchParams: () => {
      const current = useSyncExternalStore(
        subscribe,
        () => search,
        () => search,
      );

      return new URLSearchParams(current);
    },
  };
}
