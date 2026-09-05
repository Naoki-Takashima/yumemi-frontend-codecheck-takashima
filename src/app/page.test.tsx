import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Home from '@/app/page';
import { nextNavigationMock } from '@/test/mockNextNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('next/navigation', async () => {
  const { createNextNavigationMock } = await import('@/test/mockNextNavigation');

  return createNextNavigationMock();
});

describe('トップページ', () => {
  beforeEach(() => {
    nextNavigationMock.reset();
  });

  it('見出しを表示する', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '都道府県別 総人口推移グラフ',
    );
  });

  it('都道府県の選択欄を表示する', async () => {
    renderWithProviders(<Home />);

    expect(await screen.findByRole('group', { name: /都道府県/ })).toBeInTheDocument();
  });
});
