import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@/app/not-found';

describe('404 ページ', () => {
  it('見出しを表示する', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ページが見つかりません');
  });

  it('トップへ戻る導線がある', () => {
    render(<NotFound />);

    expect(screen.getByRole('link', { name: 'トップへ戻る' })).toHaveAttribute('href', '/');
  });
});
