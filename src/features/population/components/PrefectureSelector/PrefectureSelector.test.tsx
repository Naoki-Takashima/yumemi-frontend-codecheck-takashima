import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import { prefecturesFixture } from '@/test/fixtures/prefectures';

const prefectures = [...prefecturesFixture];

function setup(overrides: Partial<Parameters<typeof PrefectureSelector>[0]> = {}) {
  const onToggle = vi.fn();
  const onClear = vi.fn();
  const onRetry = vi.fn();

  render(
    <PrefectureSelector
      prefectures={prefectures}
      selectedCodes={[]}
      onToggle={onToggle}
      onClear={onClear}
      onRetry={onRetry}
      {...overrides}
    />,
  );

  return { onToggle, onClear, onRetry, user: userEvent.setup() };
}

describe('PrefectureSelector', () => {
  describe('一覧の表示', () => {
    it('47 件すべてをチェックボックスとして描画する', () => {
      setup();

      expect(screen.getAllByRole('checkbox')).toHaveLength(47);
    });

    it('ラベルと input が紐付いており、県名でチェックボックスを取得できる', () => {
      setup();

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '北海道' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '沖縄県' })).toBeInTheDocument();
    });

    it('グループの見出しを持つ', () => {
      setup();

      expect(screen.getByRole('group', { name: /都道府県/ })).toBeInTheDocument();
    });

    it('選択済みの都道府県だけがチェック状態になる', () => {
      setup({ selectedCodes: [13, 27] });

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: '大阪府' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: '北海道' })).not.toBeChecked();
    });
  });

  describe('選択の操作', () => {
    it('チェックすると prefCode 付きで onToggle が呼ばれる', async () => {
      const { onToggle, user } = setup();

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(onToggle).toHaveBeenCalledExactlyOnceWith(13);
    });

    it('チェックを外すときも同じ prefCode で onToggle が呼ばれる', async () => {
      const { onToggle, user } = setup({ selectedCodes: [13] });

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(onToggle).toHaveBeenCalledExactlyOnceWith(13);
    });

    it('ラベルの文字をクリックしても選択できる', async () => {
      const { onToggle, user } = setup();

      await user.click(screen.getByText('京都府'));

      expect(onToggle).toHaveBeenCalledExactlyOnceWith(26);
    });

    it('キーボードのスペースキーで選択できる', async () => {
      const { onToggle, user } = setup();

      screen.getByRole('checkbox', { name: '北海道' }).focus();
      await user.keyboard(' ');

      expect(onToggle).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  describe('すべて解除', () => {
    it('選択が 0 件のときは押せない', () => {
      setup({ selectedCodes: [] });

      expect(screen.getByRole('button', { name: 'すべて解除' })).toBeDisabled();
    });

    it('選択があるときに押すと onClear が呼ばれる', async () => {
      const { onClear, user } = setup({ selectedCodes: [13, 27] });

      await user.click(screen.getByRole('button', { name: 'すべて解除' }));

      expect(onClear).toHaveBeenCalledOnce();
    });
  });

  describe('選択件数の表示', () => {
    it.each([
      [[], '0 / 10 件選択中'],
      [[13], '1 / 10 件選択中'],
      [[13, 27, 1], '3 / 10 件選択中'],
    ])('%j のとき「%s」と表示する', (selectedCodes, expected) => {
      setup({ selectedCodes });

      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('件数の変化が読み上げられるよう aria-live を持つ', () => {
      setup({ selectedCodes: [13] });

      expect(screen.getByText(/1 \/ 10 件選択中/)).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('選択できる上限', () => {
    /** 上限ちょうどまで選んだ状態（prefCode 1〜10）。 */
    const fullSelection = Array.from({ length: 10 }, (_, index) => index + 1);

    it('上限に達していなければ未選択のものを選べる', () => {
      setup({ selectedCodes: fullSelection.slice(0, 9) });

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeEnabled();
    });

    it('上限に達すると未選択のものは選べなくなる', () => {
      setup({ selectedCodes: fullSelection });

      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeDisabled();
      expect(screen.getByRole('checkbox', { name: '沖縄県' })).toBeDisabled();
    });

    it('上限に達しても選択済みのものは外せる', () => {
      setup({ selectedCodes: fullSelection });

      // 選択済みまで無効にすると、上限から抜け出せなくなる
      expect(screen.getByRole('checkbox', { name: '北海道' })).toBeEnabled();
    });

    it('上限に達したら、次にとるべき操作を伝える', () => {
      setup({ selectedCodes: fullSelection });

      expect(screen.getByText(/いずれかの選択を外してください/)).toBeInTheDocument();
    });

    it('上限に達していなければ案内は出さない', () => {
      setup({ selectedCodes: fullSelection.slice(0, 9) });

      expect(screen.queryByText(/いずれかの選択を外してください/)).not.toBeInTheDocument();
    });

    it('無効なチェックボックスは押しても onToggle が呼ばれない', async () => {
      const { onToggle, user } = setup({ selectedCodes: fullSelection });

      await user.click(screen.getByRole('checkbox', { name: '東京都' }));

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('上限は変更できる', () => {
      setup({ selectedCodes: [1, 2, 3], maxSelectable: 3 });

      expect(screen.getByText(/3 \/ 3 件選択中/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '東京都' })).toBeDisabled();
    });
  });

  describe('読み込み中', () => {
    it('チェックボックスを描画せず、読み込み中であることを伝える', () => {
      setup({ isLoading: true, prefectures: [] });

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      expect(screen.getByLabelText('都道府県一覧を読み込み中')).toHaveAttribute(
        'aria-busy',
        'true',
      );
    });

    it('選択件数と解除ボタンを出さない', () => {
      setup({ isLoading: true, prefectures: [] });

      expect(screen.queryByRole('button', { name: 'すべて解除' })).not.toBeInTheDocument();
    });
  });

  describe('エラー', () => {
    it('エラーの内容を通知し、再試行の手段を出す', () => {
      setup({ isError: true, prefectures: [] });

      const alert = screen.getByRole('alert');

      expect(within(alert).getByText(/取得できませんでした/)).toBeInTheDocument();
      expect(within(alert).getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
    });

    it('再試行を押すと onRetry が呼ばれる', async () => {
      const { onRetry, user } = setup({ isError: true, prefectures: [] });

      await user.click(screen.getByRole('button', { name: '再読み込み' }));

      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('チェックボックスを描画しない', () => {
      setup({ isError: true, prefectures: [] });

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });
});
