import type { ButtonHTMLAttributes } from 'react';

import styles from '@/shared/components/Button/Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'outline' | 'primary' | 'link';
};

export function Button({ variant = 'outline', className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
