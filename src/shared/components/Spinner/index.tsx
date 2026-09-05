import styles from '@/shared/components/Spinner/Spinner.module.css';

export function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}
