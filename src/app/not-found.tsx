import Link from 'next/link';

import styles from '@/app/fallback.module.css';

/**
 * 存在しない URL の受け皿。
 */
export default function NotFound() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className={styles.description}>お探しのページは、移動または削除された可能性があります。</p>

      <Link href="/">トップへ戻る</Link>
    </main>
  );
}
