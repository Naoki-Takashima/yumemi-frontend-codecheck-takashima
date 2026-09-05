'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import styles from '@/app/fallback.module.css';
import { Button } from '@/shared/components/Button';

type ErrorProps = {
  error: Error & { digest?: string };

  retry: () => void;
};

/**
 * 想定外の実行時エラーの受け皿。
 */
export default function ErrorPage({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.container}>
      <div role="alert">
        <h1 className={styles.title}>問題が発生しました</h1>
        <p className={styles.description}>
          画面を表示できませんでした。時間をおいて、もう一度お試しください。
        </p>
      </div>

      {error.digest !== undefined && <p className={styles.digest}>エラー ID: {error.digest}</p>}

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={() => {
            retry();
          }}
        >
          再試行
        </Button>
        <Link href="/">トップへ戻る</Link>
      </div>
    </main>
  );
}
