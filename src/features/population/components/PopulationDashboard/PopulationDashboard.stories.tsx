import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { delay, http, HttpResponse } from 'msw';

import { PopulationDashboard } from '@/features/population/components/PopulationDashboard';
import { handlers } from '@/test/msw/handlers';

const meta = {
  title: '人口/PopulationDashboard',
  component: PopulationDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '都道府県の選択とグラフ表示をまとめる画面。',
          '',
          'BFF（/api/prefectures）からデータを取得するため、',
          'ストーリーでは MSW でその経路を横取りしている。',
          'テストと同じ src/test/msw/handlers.ts を再利用しており、',
          'モックを二重に管理していない。',
        ].join('\n'),
      },
    },
  },
  beforeEach: ({ msw }) => {
    msw.use(...handlers);
  },
} satisfies Meta<typeof PopulationDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** BFF から 47 件を取得して表示する。 */
export const Success: Story = { name: '取得成功' };

/** 応答が返らない場合。読み込み中のスケルトンが表示される。 */
export const Loading: Story = {
  name: '読み込み中',
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/prefectures', async () => {
        await delay('infinite');
        return HttpResponse.json({ result: [] });
      }),
    );
  },
};

/** BFF が 502 を返した場合。エラーと再試行ボタンを表示する。 */
export const Failure: Story = {
  name: '取得失敗',
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/prefectures', () =>
        HttpResponse.json(
          {
            error: {
              code: 'UPSTREAM_ERROR',
              message: 'データを取得できませんでした。時間をおいて再度お試しください。',
            },
          },
          { status: 502 },
        ),
      ),
    );
  },
};
