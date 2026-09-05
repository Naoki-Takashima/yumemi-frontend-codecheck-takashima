import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  PopulationTypeTabs,
  tabId,
  tabPanelId,
} from '@/features/population/components/PopulationTypeTabs';
import {
  DEFAULT_POPULATION_TYPE,
  POPULATION_TYPE_LABELS,
  type PopulationType,
} from '@/features/population/types';

const meta = {
  title: '人口/PopulationTypeTabs',
  component: PopulationTypeTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'WAI-ARIA のタブパターンを自前で実装している。',
          'ヘッドレス UI ライブラリは使っていない。',
          '',
          '- Tab キーでの移動先は選択中の 1 つに絞る（ロービング tabIndex）',
          '- ← → で前後へ移動し、端では反対側へ回る',
          '- Home で先頭、End で末尾へ移動する',
          '- 移動と同時に選択も切り替わる（自動アクティベーション）',
          '',
          '幅が足りない場合は折り返さず横スクロールする。',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    value: {
      control: 'inline-radio',
      options: Object.keys(POPULATION_TYPE_LABELS),
    },
  },
} satisfies Meta<typeof PopulationTypeTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 総人口を選択した初期状態。 */
export const Default: Story = {
  name: '既定（総人口）',
  args: { value: DEFAULT_POPULATION_TYPE, onChange: () => undefined },
};

/** 中ほどのタブを選択した状態。下線と文字色で選択を示す。 */
export const Working: Story = {
  name: '生産年齢人口を選択',
  args: { value: 'working', onChange: () => undefined },
};

/**
 * キーボード操作を試せる状態。
 * タブへフォーカスして ← → Home End を押すと選択が動く。
 */
export const Interactive: Story = {
  name: 'キーボード操作の確認',
  args: { value: DEFAULT_POPULATION_TYPE, onChange: () => undefined },
  render: function Render() {
    const [value, setValue] = useState<PopulationType>(DEFAULT_POPULATION_TYPE);

    return (
      <div>
        <PopulationTypeTabs value={value} onChange={setValue} />
        <div
          role="tabpanel"
          id={tabPanelId(value)}
          aria-labelledby={tabId(value)}
          tabIndex={0}
          style={{ padding: '1.5rem 0' }}
        >
          選択中: {POPULATION_TYPE_LABELS[value]}
        </div>
      </div>
    );
  },
};

/** 幅が狭い場合。折り返さず横スクロールになる。 */
export const Narrow: Story = {
  name: '狭い幅',
  args: { value: DEFAULT_POPULATION_TYPE, onChange: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '18rem', border: '1px dashed #ccc' }}>
        <Story />
      </div>
    ),
  ],
};
