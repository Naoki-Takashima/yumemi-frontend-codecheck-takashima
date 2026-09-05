import type { Metadata, Viewport } from 'next';

import '@/app/globals.css';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: '都道府県別 総人口推移グラフ',
  description:
    '都道府県を選択して、総人口・年少人口・生産年齢人口・老年人口の推移を折れ線グラフで表示します。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
