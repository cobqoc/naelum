import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'rgnlgpfazxgwsnkgrhzs.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'www.foodsafetykorea.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.foodsafetykorea.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.wikim.re.kr',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [
      {
        source: '/ingredients/browse',
        destination: '/ingredients',
        permanent: true,
      },
    ];
  },
  async headers() {
    const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      .replace('https://', '')
      .split('/')[0]

    const csp = [
      "default-src 'self'",
      // Next.js는 hydration용 인라인 스크립트 필요 — nonce 미사용 시 unsafe-inline 불가피
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // 이미지: Supabase Storage, Unsplash, Google 프로필 사진
      "img-src 'self' data: blob: https:",
      // API 연결: Supabase, Google/Kakao OAuth
      [
        "connect-src 'self'",
        supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : '',
        'https://accounts.google.com',
        'https://kauth.kakao.com https://kapi.kakao.com',
      ].filter(Boolean).join(' '),
      "font-src 'self' data:",
      "frame-src 'none'",     // iframe 삽입 차단
      "object-src 'none'",    // Flash/Plugin 차단
      "base-uri 'self'",      // <base> 태그 인젝션 차단
      "form-action 'self'",   // 폼 외부 전송 차단
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HTTPS 강제: 1년간 브라우저가 HTTP 시도를 차단
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // DSN 없으면 소스맵 업로드 등 건너뜀
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // 소스맵: 프로덕션 빌드에서 숨기기
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
