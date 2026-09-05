import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from '@/app/page';

describe('トップページ', () => {
  it('見出しを表示する', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '都道府県別 総人口推移グラフ',
    );
  });
});
