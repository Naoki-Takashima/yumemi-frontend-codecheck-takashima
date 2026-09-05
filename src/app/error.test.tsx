import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorPage from '@/app/error';

describe('想定外エラーの受け皿', () => {
  beforeEach(() => {
    // 受け皿は必ず console.error を呼ぶ。テスト出力を汚さないよう黙らせる
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('エラーであることを読み上げさせる', () => {
    render(<ErrorPage error={new Error('boom')} retry={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('問題が発生しました');
  });

  it('再試行を押すと retry が呼ばれる', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();

    render(<ErrorPage error={new Error('boom')} retry={retry} />);
    await user.click(screen.getByRole('button', { name: '再試行' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('digest があればサーバーログとの突き合わせ用に出す', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<ErrorPage error={error} retry={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('digest がなければ何も出さない', () => {
    render(<ErrorPage error={new Error('boom')} retry={vi.fn()} />);

    expect(screen.queryByText(/エラー ID/)).not.toBeInTheDocument();
  });

  it('原因の詳細は画面に出さない', () => {
    // 本番のサーバー側エラーは既に伏せられているが、
    // クライアント側のエラーは message がそのまま渡る。画面には出さない
    render(<ErrorPage error={new Error('データベース接続に失敗')} retry={vi.fn()} />);

    expect(screen.queryByText(/データベース/)).not.toBeInTheDocument();
  });

  it('トップへ戻る導線がある', () => {
    render(<ErrorPage error={new Error('boom')} retry={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'トップへ戻る' })).toHaveAttribute('href', '/');
  });
});
