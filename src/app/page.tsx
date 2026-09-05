import { Suspense } from 'react';

import styles from '@/app/page.module.css';
import { PopulationDashboard } from '@/features/population/components/PopulationDashboard';

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>都道府県別 総人口推移グラフ</h1>
        <p className={styles.description}>
          都道府県を選択すると、人口の推移を折れ線グラフで表示します。
        </p>
      </header>

      <Suspense fallback={<p className={styles.loading}>読み込んでいます…</p>}>
        <PopulationDashboard />
      </Suspense>
    </main>
  );
}
