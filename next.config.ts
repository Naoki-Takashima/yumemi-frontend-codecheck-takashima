import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';


const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join('; ')
  .concat(isDevelopment ? '' : '; upgrade-insecure-requests');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // MIME タイプの推測を禁じる
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 外部サイトへ遷移する際にパスやクエリを送らない
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // frame-ancestors に対応しないブラウザ向けの保険
  { key: 'X-Frame-Options', value: 'DENY' },
  // 使わない機能は明示的に無効化する
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]);
  },
};

export default nextConfig;
