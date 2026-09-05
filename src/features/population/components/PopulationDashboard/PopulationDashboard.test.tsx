import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PopulationDashboard } from '@/features/population/components/PopulationDashboard';
import { MAX_SELECTABLE_PREFECTURES } from '@/features/population/constants';
import { createPopulationFixture } from '@/test/fixtures/population';
import { prefecturesFixture } from '@/test/fixtures/prefectures';
import { nextNavigationMock, replaceCalls } from '@/test/mockNextNavigation';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';

// vi.mock はファイル先頭へ巻き上げられるため、
// ファクトリの中では import 済みの変数を参照できない。動的に読み込む。
vi.mock('next/navigation', async () => {
  const { createNextNavigationMock } = await import('@/test/mockNextNavigation');

  return createNextNavigationMock();
});

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  const { MockResponsiveContainer } = await import('@/test/mockResponsiveContainer');

  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

describe('PopulationDashboard', () => {
  beforeEach(() => {
    nextNavigationMock.reset();
  });

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
    expect(screen.getByText(/1 \/ 10 件選択中/)).toBeInTheDocument();
  });

  it('複数選択できる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '大阪府' }));

    expect(screen.getByText(/2 \/ 10 件選択中/)).toBeInTheDocument();
  });

  it('チェックを外すと選択から除かれる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '東京都' }));

    expect(screen.getByRole('checkbox', { name: '東京都' })).not.toBeChecked();
    expect(screen.getByText(/0 \/ 10 件選択中/)).toBeInTheDocument();
  });

  it('すべて解除ですべての選択が外れる', async () => {
    const { user } = await renderAndWait();

    await user.click(screen.getByRole('checkbox', { name: '東京都' }));
    await user.click(screen.getByRole('checkbox', { name: '大阪府' }));
    await user.click(screen.getByRole('button', { name: 'すべて解除' }));

    expect(screen.getByText(/0 \/ 10 件選択中/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '東京都' })).not.toBeChecked();
  });

  describe('URL との同期', () => {
    it('都道府県を選ぶと URL に載る', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(nextNavigationMock.search).toBe('prefCodes=13');
    });

    it('複数選んだ順に URL へ並ぶ', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '大阪府' }));
      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(nextNavigationMock.search).toBe('prefCodes=27%2C13');
    });

    it('人口種別も URL に載る', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('tab', { name: '年少人口' }));

      expect(nextNavigationMock.search).toBe('type=young');
    });

    it('既定の総人口に戻すと URL から消える', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('tab', { name: '年少人口' }));
      await user.click(screen.getByRole('tab', { name: '総人口' }));

      expect(nextNavigationMock.search).toBe('');
    });

    it('すべて解除すると URL から消える', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));
      await user.click(screen.getByRole('button', { name: 'すべて解除' }));

      expect(nextNavigationMock.search).toBe('');
    });

    it('履歴を積まずに置き換える', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      // push だと選択のたびに履歴が増え、戻るボタンで画面を離れられなくなる
      expect(replaceCalls).toEqual(['/?prefCodes=13']);
    });
  });

  describe('URL からの復元', () => {
    it('選択済みの都道府県が復元される', async () => {
      nextNavigationMock.reset('prefCodes=13,27');

      await renderAndWait();

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: '大阪府' })).toBeChecked();
      expect(screen.getByText(/2 \/ 10 件選択中/)).toBeInTheDocument();
    });

    it('人口種別が復元される', async () => {
      nextNavigationMock.reset('type=elderly');

      await renderAndWait();

      expect(screen.getByRole('tab', { name: '老年人口' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('復元した状態でグラフが描画される', async () => {
      nextNavigationMock.reset('prefCodes=13&type=young');

      await renderAndWait();

      expect(await screen.findByText(/年少人口の推移/)).toHaveTextContent('東京都');
    });

    it('不正な値は無視して画面を出す', async () => {
      nextNavigationMock.reset('prefCodes=999,abc,13&type=unknown');

      await renderAndWait();

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
      expect(screen.getByText(/1 \/ 10 件選択中/)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '総人口' })).toHaveAttribute('aria-selected', 'true');
    });

    it('上限を超える指定は切り捨てる', async () => {
      // URL 経由で上限を超えられては、制限した意味がなくなる
      const codes = Array.from({ length: 20 }, (_, index) => index + 1);
      nextNavigationMock.reset(`prefCodes=${codes.join(',')}`);

      await renderAndWait();

      expect(screen.getByText(/10 \/ 10 件選択中/)).toBeInTheDocument();
    });
  });

  describe('選択できる上限', () => {
    /** 上限ちょうどまで選ぶ。グラフの読みやすさのための制限。 */
    async function selectUpToLimit(user: ReturnType<typeof userEvent.setup>) {
      const names = prefecturesFixture.slice(0, MAX_SELECTABLE_PREFECTURES);

      for (const { prefName } of names) {
        await user.click(screen.getByRole('checkbox', { name: prefName }));
      }
    }

    it('上限まで選べる', async () => {
      const { user } = await renderAndWait();

      await selectUpToLimit(user);

      expect(screen.getByText(/10 \/ 10 件選択中/)).toBeInTheDocument();
    });

    it('上限を超えて選ぼうとしても選択は増えない', async () => {
      const { user } = await renderAndWait();

      await selectUpToLimit(user);
      // 無効化されているため反応しない
      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(screen.getByText(/10 \/ 10 件選択中/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '東京都' })).not.toBeChecked();
    });

    it('選択を 1 つ外すと、また選べるようになる', async () => {
      const { user } = await renderAndWait();

      await selectUpToLimit(user);
      await user.click(screen.getByRole('checkbox', { name: '北海道' }));

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeEnabled();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
      expect(screen.getByText(/10 \/ 10 件選択中/)).toBeInTheDocument();
    });
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
      expect(screen.getByText(/1 \/ 10 件選択中/)).toBeInTheDocument();
    });
  });

  describe('グラフ', () => {
    it('都道府県を選ぶまでは案内を出す', async () => {
      await renderAndWait();

      expect(screen.getByText(/都道府県を選択すると/)).toBeInTheDocument();
    });

    it('選択するとグラフの説明が現れる', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(await screen.findByText(/総人口の推移/)).toBeInTheDocument();
      expect(screen.getByText(/総人口の推移/)).toHaveTextContent('東京都');
    });

    it('タブを切り替えるとグラフの種別も変わる', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));
      await screen.findByText(/総人口の推移/);

      await user.click(screen.getByRole('tab', { name: '老年人口' }));

      expect(await screen.findByText(/老年人口の推移/)).toBeInTheDocument();
    });

    it('選択を解除するとグラフが消えて案内に戻る', async () => {
      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));
      await screen.findByText(/総人口の推移/);

      await user.click(screen.getByRole('button', { name: 'すべて解除' }));

      expect(screen.getByText(/都道府県を選択すると/)).toBeInTheDocument();
    });

    it('一部の県だけ失敗しても、取れた分は表示する', async () => {
      server.use(
        http.get('*/api/population', ({ request }) => {
          const prefCode = new URL(request.url).searchParams.get('prefCode');

          // 大阪府（27）だけ失敗させる
          if (prefCode === '27') {
            return HttpResponse.json(
              { error: { code: 'UPSTREAM_ERROR', message: '取得できませんでした' } },
              { status: 502 },
            );
          }

          return HttpResponse.json({ result: createPopulationFixture(Number(prefCode)) });
        }),
      );

      const { user } = await renderAndWait();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));
      await user.click(screen.getByRole('checkbox', { name: '大阪府' }));

      // 成功した東京都はグラフに残る
      expect(await screen.findByText(/総人口の推移/)).toHaveTextContent('東京都');
      // 失敗した大阪府だけを知らせる
      expect(await screen.findByRole('alert')).toHaveTextContent('大阪府');
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
