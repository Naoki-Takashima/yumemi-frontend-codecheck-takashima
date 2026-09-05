import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PopulationChart } from '@/features/population/components/PopulationChart';
import type { PopulationEntry } from '@/features/population/lib/toChartSeries';
import { createPopulationFixture } from '@/test/fixtures/population';
import { prefecturesFixture } from '@/test/fixtures/prefectures';

function entry(prefCode: number): PopulationEntry {
  const prefecture = prefecturesFixture.find((p) => p.prefCode === prefCode);

  return {
    prefCode,
    prefName: prefecture?.prefName ?? `コード${String(prefCode)}`,
    composition: createPopulationFixture(prefCode),
  };
}

const meta = {
  title: '人口/PopulationChart',
  component: PopulationChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '人口の推移を折れ線で表す。',
          '',
          '実データは 2045 年まで伸びるが、boundaryYear（2020）より後は推計値。',
          '実績と同じ見た目のまま伸ばすと確定値と誤読されるため、',
          '境界に破線を引き、グラフの下にも注記を出している。',
          '',
          '線の色は選択順ではなく prefCode から決めている。',
          'チェックを外して付け直しても色が入れ替わらない。',
        ].join('\n'),
      },
    },
  },
  args: { type: 'total' },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['total', 'young', 'working', 'elderly'],
    },
    entries: { control: false },
  },
} satisfies Meta<typeof PopulationChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 1 県のみ。2020 年の境界に破線が入る。 */
export const Single: Story = {
  name: '1 県',
  args: { entries: [entry(13)] },
};

/** 3 県。色が十分に離れていることを確認する。 */
export const Multiple: Story = {
  name: '3 県',
  args: { entries: [entry(13), entry(27), entry(1)] },
};

/** 隣り合う prefCode を並べ、色が近づきすぎないことを確認する。 */
export const AdjacentCodes: Story = {
  name: '連番の都道府県',
  args: { entries: [entry(11), entry(12), entry(13), entry(14)] },
};

/** 年少人口。種別を変えても同じ描画の仕組みで扱える。 */
export const Young: Story = {
  name: '年少人口',
  args: { entries: [entry(13), entry(27)], type: 'young' },
};

/** 推計値の年を含まない場合。注記も破線も出ない。 */
export const WithoutEstimate: Story = {
  name: '推計値を含まない',
  args: {
    entries: [
      {
        prefCode: 13,
        prefName: '東京都',
        composition: {
          boundaryYear: 2020,
          data: [
            {
              label: '総人口',
              data: [
                { year: 2000, value: 12_064_101 },
                { year: 2010, value: 13_159_388 },
                { year: 2020, value: 14_047_594 },
              ],
            },
          ],
        },
      },
    ],
  },
};

/** 年がそろっていない場合。値の無い年は線を繋がず切る。 */
export const SparseYears: Story = {
  name: '年がそろわない',
  args: {
    entries: [
      {
        prefCode: 13,
        prefName: '東京都',
        composition: {
          boundaryYear: 2020,
          data: [
            {
              label: '総人口',
              data: [
                { year: 1980, value: 11_618_281 },
                { year: 1990, value: 11_855_563 },
                { year: 2000, value: 12_064_101 },
              ],
            },
          ],
        },
      },
      {
        prefCode: 27,
        prefName: '大阪府',
        composition: {
          boundaryYear: 2020,
          data: [
            {
              label: '総人口',
              data: [
                { year: 2000, value: 8_805_081 },
                { year: 2010, value: 8_865_245 },
                { year: 2020, value: 8_837_685 },
              ],
            },
          ],
        },
      },
    ],
  },
};

/** データが無い場合。 */
export const Empty: Story = {
  name: 'データなし',
  args: { entries: [] },
};
