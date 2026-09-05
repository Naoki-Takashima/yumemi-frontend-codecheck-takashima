import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { PrefectureSelector } from '@/features/population/components/PrefectureSelector';
import { prefecturesFixture } from '@/test/fixtures/prefectures';

const meta = {
  title: '人口/PrefectureSelector',
  component: PrefectureSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'データの取得は行わず、受け取った内容の表示に徹する。',
          '状態の持ち主を呼び出し側に寄せることで、この部品を単体で検証できる。',
          '',
          '列数はメディアクエリではなく grid の auto-fill で決めているため、',
          'ビューポートを狭めると 1〜7 列に自動で追従する。',
        ].join('\n'),
      },
    },
  },
  args: {
    prefectures: [...prefecturesFixture],
    selectedCodes: [],
    onToggle: fn(),
    onClear: fn(),
    onRetry: fn(),
  },
  argTypes: {
    prefectures: { control: false },
    selectedCodes: { control: false },
  },
} satisfies Meta<typeof PrefectureSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期状態。47 件を表示し、まだ何も選択していない。 */
export const Unselected: Story = { name: '未選択' };

/** 選択済みの項目は色と太さで強調し、「すべて解除」が押せるようになる。 */
export const Selected: Story = {
  name: '選択あり',
  args: { selectedCodes: [13, 27, 1] },
};

/** 47 件すべてを選択した状態。グリッドが崩れないことを確認する。 */
export const AllSelected: Story = {
  name: '全件選択',
  args: { selectedCodes: prefecturesFixture.map((p) => p.prefCode) },
};

/**
 * 読み込み中。実際の 47 件分のスケルトンを描画するため、
 * 読み込み完了時にレイアウトが飛ばない。
 */
export const Loading: Story = {
  name: '読み込み中',
  args: { prefectures: [], isLoading: true },
};

/** 取得に失敗した状態。再試行の手段を出す。 */
export const ErrorState: Story = {
  name: 'エラー',
  args: { prefectures: [], isError: true },
};
