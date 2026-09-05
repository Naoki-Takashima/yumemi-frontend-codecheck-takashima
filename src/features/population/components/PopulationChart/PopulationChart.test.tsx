import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PopulationChart } from '@/features/population/components/PopulationChart';
import type { PopulationEntry } from '@/features/population/lib/toChartSeries';
import { createPopulationFixture } from '@/test/fixtures/population';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  const { MockResponsiveContainer } = await import('@/test/mockResponsiveContainer');

  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

function entry(prefCode: number, prefName: string): PopulationEntry {
  return { prefCode, prefName, composition: createPopulationFixture(prefCode) };
}

describe('PopulationChart', () => {
  describe('データが無い場合', () => {
    it('その旨を伝える', () => {
      render(<PopulationChart entries={[]} type="total" />);

      expect(screen.getByText('表示できるデータがありません。')).toBeInTheDocument();
    });
  });

  describe('支援技術からの見え方', () => {
    it('図の中にフォーカスできる要素を残さない', () => {
      const { container } = render(
        <PopulationChart entries={[entry(13, '東京都')]} type="total" />,
      );

      const hidden = container.querySelector('[aria-hidden="true"]');
      const focusable = hidden?.querySelectorAll(
        'a[href], button, input, [tabindex]:not([tabindex="-1"])',
      );

      expect(focusable).toHaveLength(0);
    });

    it('図の内容を文章でも伝える', () => {
      render(<PopulationChart entries={[entry(13, '東京都')]} type="total" />);

      expect(screen.getByText(/総人口の推移/)).toHaveTextContent('東京都');
    });
  });

  describe('軸のラベル', () => {
    it('縦軸と横軸の名前を出す', () => {
      const { container } = render(
        <PopulationChart entries={[entry(13, '東京都')]} type="total" />,
      );

      expect(container.textContent).toContain('人口数');
      expect(container.textContent).toContain('年度');
    });
  });

  describe('凡例', () => {
    it('選択した都道府県を並べる', () => {
      render(<PopulationChart entries={[entry(13, '東京都'), entry(27, '大阪府')]} type="total" />);

      expect(screen.getByText('東京都')).toBeInTheDocument();
      expect(screen.getByText('大阪府')).toBeInTheDocument();
    });
  });

  describe('推計値の扱い', () => {
    it('境界の年を注記で示す', () => {
      render(<PopulationChart entries={[entry(13, '東京都')]} type="total" />);

      expect(screen.getByText(/2020 年より後の値は推計値です/)).toBeInTheDocument();
    });

    it('グラフの中には境界線を引かない', () => {
      // 推計値であることは注記とツールチップで伝える
      const { container } = render(
        <PopulationChart entries={[entry(13, '東京都')]} type="total" />,
      );

      expect(container.querySelector('.recharts-reference-line')).toBeNull();
      expect(container.textContent).not.toContain('これ以降は推計値');
    });

    it('推計値の年を含まないデータには注記を出さない', () => {
      const withoutEstimate: PopulationEntry = {
        prefCode: 13,
        prefName: '東京都',
        composition: {
          boundaryYear: 2020,
          data: [
            {
              label: '総人口',
              data: [
                { year: 2000, value: 100 },
                { year: 2010, value: 200 },
              ],
            },
          ],
        },
      };

      render(<PopulationChart entries={[withoutEstimate]} type="total" />);

      expect(screen.queryByText(/推計値です/)).not.toBeInTheDocument();
    });
  });

  describe('スクリーンリーダー向けの説明', () => {
    it('種別・対象・期間を文章で伝える', () => {
      render(<PopulationChart entries={[entry(13, '東京都'), entry(27, '大阪府')]} type="young" />);

      const summary = screen.getByText(/年少人口の推移/);

      expect(summary).toHaveTextContent('東京都、大阪府');
      expect(summary).toHaveTextContent('1960 年から 2045 年まで');
      expect(summary).toHaveTextContent('2020 年より後は推計値');
    });

    it('グラフ本体は読み上げの対象から外す', () => {
      const { container } = render(
        <PopulationChart entries={[entry(13, '東京都')]} type="total" />,
      );

      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('人口種別の切り替え', () => {
    it('種別ごとに説明文が変わる', () => {
      const { rerender } = render(<PopulationChart entries={[entry(13, '東京都')]} type="total" />);
      expect(screen.getByText(/総人口の推移/)).toBeInTheDocument();

      rerender(<PopulationChart entries={[entry(13, '東京都')]} type="elderly" />);
      expect(screen.getByText(/老年人口の推移/)).toBeInTheDocument();
    });
  });
});
