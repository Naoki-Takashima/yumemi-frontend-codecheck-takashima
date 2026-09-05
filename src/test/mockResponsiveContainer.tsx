import { cloneElement, type ReactElement } from 'react';

/**
 * Recharts の `ResponsiveContainer` をテスト用に差し替える。
 */
export function MockResponsiveContainer({ children }: { children: ReactElement }) {
  return cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
    width: 800,
    height: 400,
  });
}
