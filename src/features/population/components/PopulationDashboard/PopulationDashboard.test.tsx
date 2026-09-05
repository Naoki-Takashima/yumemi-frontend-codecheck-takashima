import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { PopulationDashboard } from '@/features/population/components/PopulationDashboard';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('PopulationDashboard', () => {
  async function renderAndWait() {
    const user = userEvent.setup();
    renderWithProviders(<PopulationDashboard />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(47);
    });

    return { user };
  }

  it('BFF から取得した都道府県を表示する', async () => {
    await renderAndWait();

    expect(screen.getByRole('checkbox', { name: '東京都' })).toBeInTheDocument();
  });

  it('チェックすると選択状態と件数が更新される', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));

    expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
    expect(screen.getByText('1 件選択中')).toBeInTheDocument();
  });

  it('複数選択できる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '大阪府' }));

    expect(screen.getByText('2 件選択中')).toBeInTheDocument();
  });

  it('チェックを外すと選択から除かれる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '東京都' }));

    expect(screen.getByRole('checkbox', { name: '東京都' })).not.toBeChecked();
    expect(screen.getByText('0 件選択中')).toBeInTheDocument();
  });

  it('すべて解除ですべての選択が外れる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '大阪府' }));
    await user.click(screen.getByRole('button', { name: 'すべて解除' }));

    expect(screen.getByText('0 件選択中')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '東京都' })).not.toBeChecked();
  });

  it('取得に失敗したらエラーを表示する', async () => {
    server.use(
      http.get('*/api/prefectures', () =>
        HttpResponse.json(
          { error: { code: 'UPSTREAM_ERROR', message: '取得できませんでした' } },
          { status: 502 },
        ),
      ),
    );

    renderWithProviders(<PopulationDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/取得できませんでした/);
  });
});
