import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PopulationTypeTabs } from '@/features/population/components/PopulationTypeTabs';
import { DEFAULT_POPULATION_TYPE, type PopulationType } from '@/features/population/types';

const LABELS = ['総人口', '年少人口', '生産年齢人口', '老年人口'] as const;

function setup(value: PopulationType = DEFAULT_POPULATION_TYPE) {
  const onChange = vi.fn();
  render(<PopulationTypeTabs value={value} onChange={onChange} />);

  return { onChange, user: userEvent.setup() };
}

/** キーボード操作で選択が動くことを確かめるため、状態を保持する版も用意する。 */
function ControlledTabs() {
  const [value, setValue] = useState<PopulationType>(DEFAULT_POPULATION_TYPE);
  return <PopulationTypeTabs value={value} onChange={setValue} />;
}

function setupControlled() {
  render(<ControlledTabs />);
  return { user: userEvent.setup() };
}

describe('PopulationTypeTabs', () => {
  describe('構造', () => {
    it('名前付きのタブ一覧として認識される', () => {
      setup();

      expect(screen.getByRole('tablist', { name: '人口種別' })).toBeInTheDocument();
    });

    it('4 つの種別をタブとして描画する', () => {
      setup();

      expect(screen.getAllByRole('tab')).toHaveLength(4);
      for (const label of LABELS) {
        expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
      }
    });

    it('選択中のタブだけが aria-selected を持つ', () => {
      setup('young');

      expect(screen.getByRole('tab', { name: '年少人口' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('tab', { name: '総人口' })).toHaveAttribute('aria-selected', 'false');
    });

    it('各タブが対応するパネルを aria-controls で指す', () => {
      setup();

      expect(screen.getByRole('tab', { name: '総人口' })).toHaveAttribute(
        'aria-controls',
        'population-tabpanel-total',
      );
      expect(screen.getByRole('tab', { name: '老年人口' })).toHaveAttribute(
        'aria-controls',
        'population-tabpanel-elderly',
      );
    });

    it('form の中に置いても送信されないよう type="button" を持つ', () => {
      setup();

      for (const tab of screen.getAllByRole('tab')) {
        expect(tab).toHaveAttribute('type', 'button');
      }
    });
  });

  describe('Tab キーでの到達', () => {
    it('選択中のタブだけが Tab キーの移動先になる', () => {
      setup('working');

      expect(screen.getByRole('tab', { name: '生産年齢人口' })).toHaveAttribute('tabindex', '0');
      for (const label of ['総人口', '年少人口', '老年人口'] as const) {
        expect(screen.getByRole('tab', { name: label })).toHaveAttribute('tabindex', '-1');
      }
    });

    it('Tab キー 1 回でタブ群を通過できる', async () => {
      const { user } = setup();

      await user.tab();
      expect(screen.getByRole('tab', { name: '総人口' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: '総人口' })).not.toHaveFocus();
      expect(screen.queryByRole('tab', { name: '年少人口' })).not.toHaveFocus();
    });
  });

  describe('クリックでの切り替え', () => {
    it.each([
      ['年少人口', 'young'],
      ['生産年齢人口', 'working'],
      ['老年人口', 'elderly'],
    ])('%s を押すと %s が渡される', async (label, expected) => {
      const { onChange, user } = setup();

      await user.click(screen.getByRole('tab', { name: label }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith(expected);
    });
  });

  describe('キーボードでの移動', () => {
    it('ArrowRight で次のタブへ移り、選択も切り替わる', async () => {
      const { user } = setupControlled();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{ArrowRight}');

      const next = screen.getByRole('tab', { name: '年少人口' });
      expect(next).toHaveFocus();
      expect(next).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowLeft で前のタブへ移る', async () => {
      const { user } = setupControlled();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');

      expect(screen.getByRole('tab', { name: '年少人口' })).toHaveFocus();
    });

    it('末尾で ArrowRight を押すと先頭へ回る', async () => {
      const { user } = setupControlled();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');

      expect(screen.getByRole('tab', { name: '総人口' })).toHaveFocus();
    });

    it('先頭で ArrowLeft を押すと末尾へ回る', async () => {
      const { user } = setupControlled();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: '老年人口' })).toHaveFocus();
    });

    it('End で末尾、Home で先頭へ移る', async () => {
      const { user } = setupControlled();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: '老年人口' })).toHaveFocus();

      await user.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: '総人口' })).toHaveFocus();
    });

    it('関係のないキーでは何も起きない', async () => {
      const { onChange, user } = setup();

      screen.getByRole('tab', { name: '総人口' }).focus();
      await user.keyboard('{ArrowDown}a');

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
