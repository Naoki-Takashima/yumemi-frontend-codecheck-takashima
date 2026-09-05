import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { ErrorState } from '@/shared/components/ErrorState';

const meta = {
  title: '共通UI/ErrorState',
  component: ErrorState,
  parameters: {
    docs: {
      description: {
        component:
          'role="alert" を持たせているため、読み込み後に現れた場合もスクリーンリーダーへ通知される。',
      },
    },
  },
  args: {
    message: '都道府県一覧を取得できませんでした。',
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 再試行できる場合。取得の失敗など、やり直す価値があるとき。 */
export const WithRetry: Story = {
  name: '再試行あり',
  args: { retryLabel: '再読み込み' },
};

/** 再試行しても結果が変わらない場合はボタンを出さない。 */
export const WithoutRetry: Story = {
  name: '再試行なし',
  args: { onRetry: undefined },
};

/** 長い文言でも折り返して収まることを確認する。 */
export const LongMessage: Story = {
  name: '長い文言',
  args: {
    message:
      'データを取得できませんでした。ネットワークの状態を確認したうえで、しばらく時間をおいてから再度お試しください。問題が続く場合は管理者にお問い合わせください。',
  },
};
