'use client';

import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import styles from '@/features/population/components/PopulationChart/PopulationChart.module.css';
import { formatPopulation, formatPopulationShort } from '@/features/population/lib/formatNumber';
import { seriesColor, seriesShape } from '@/features/population/lib/seriesColor';
import { toChartSeries, type PopulationEntry } from '@/features/population/lib/toChartSeries';
import { POPULATION_TYPE_LABELS, type PopulationType } from '@/features/population/types';

type PopulationChartProps = {
  entries: PopulationEntry[];
  type: PopulationType;
};

function buildStyleMap(entries: PopulationEntry[]) {
  return new Map(
    entries.map((entry) => [
      entry.prefName,
      { color: seriesColor(entry.prefCode), shape: seriesShape(entry.prefCode) },
    ]),
  );
}

export function PopulationChart({ entries, type }: PopulationChartProps) {
  const { rows, prefNames, boundaryYear } = toChartSeries(entries, type);
  const seriesStyles = buildStyleMap(entries);
  const typeLabel = POPULATION_TYPE_LABELS[type];

  if (rows.length === 0) {
    return <p className={styles.empty}>表示できるデータがありません。</p>;
  }

  const lastYear = rows.at(-1)?.year;
  const hasEstimate = boundaryYear !== null && lastYear !== undefined && lastYear > boundaryYear;

  return (
    <div>
      <p className="srOnly">
        {typeLabel}の推移。対象は{prefNames.join('、')}。{rows[0]?.year} 年から {lastYear} 年まで。
        {hasEstimate && `${String(boundaryYear)} 年より後は推計値。`}
      </p>

      <div className={styles.chart} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 16, bottom: 24, left: 16 }}
            accessibilityLayer={false}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="year" tickMargin={8}>
              <Label value="年度" position="insideBottomRight" offset={-16} />
            </XAxis>

            <YAxis tickFormatter={formatPopulationShort} width={72}>
              <Label
                value="人口数"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }}
              />
            </YAxis>

            {hasEstimate && (
              <ReferenceLine x={boundaryYear} stroke="currentColor" strokeDasharray="4 4">
                <Label value="これ以降は推計値" position="insideTopRight" />
              </ReferenceLine>
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const year = Number(label);

                return (
                  <div className={styles.tooltip}>
                    <p className={styles.tooltipYear}>{year} 年</p>
                    <div className={styles.tooltipList}>
                      {payload.map((item) => (
                        <div key={String(item.dataKey)} className={styles.tooltipItem}>
                          <span className={styles.tooltipName}>
                            <span
                              className={styles.tooltipSwatch}
                              style={{ backgroundColor: item.color }}
                              aria-hidden="true"
                            />
                            {item.name}
                          </span>
                          <span className={styles.tooltipValue}>
                            {formatPopulation(Number(item.value))}
                          </span>
                        </div>
                      ))}
                    </div>
                    {boundaryYear !== null && year > boundaryYear && (
                      <p className={styles.tooltipEstimate}>推計値</p>
                    )}
                  </div>
                );
              }}
            />

            <Legend verticalAlign="top" height={36} />

            {prefNames.map((prefName) => {
              const style = seriesStyles.get(prefName);

              return (
                <Line
                  key={prefName}
                  type="monotone"
                  dataKey={prefName}
                  name={prefName}
                  stroke={style?.color}
                  strokeWidth={2}
                  legendType={style?.shape}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasEstimate && <p className={styles.note}>※ {boundaryYear} 年より後の値は推計値です。</p>}
    </div>
  );
}
