import { Button } from '@/shared/components/Button';
import styles from '@/shared/components/ErrorState/ErrorState.module.css';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ message, onRetry, retryLabel = '再試行' }: ErrorStateProps) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
