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

  describe('人口種別の切り替え', () => {
    it('初期状態では総人口が選ばれている', async () => {
      await renderAndWait();

      expect(screen.getByRole('tab', { name: '総人口' })).toHaveAttribute('aria-selected', 'true');
    });

    it('タブを押すと選択が切り替わる', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('tab', { name: '年少人口' }));

      expect(screen.getByRole('tab', { name: '年少人口' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('tab', { name: '総人口' })).toHaveAttribute('aria-selected', 'false');
    });

    it('タブが指すパネルが実在し、そのタブから名前を得ている', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('tab', { name: '老年人口' }));

      const panel = screen.getByRole('tabpanel');
      const tab = screen.getByRole('tab', { name: '老年人口' });

      expect(panel.id).toBe(tab.getAttribute('aria-controls'));
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    });

    it('都道府県の選択状態はタブを切り替えても保たれる', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));
      await user.click(screen.getByRole('tab', { name: '生産年齢人口' }));

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
      expect(screen.getByText('1 件選択中')).toBeInTheDocument();
    });
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
