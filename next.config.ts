import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';
import path from "path";

const nextConfig: NextConfig = {
  // @supabase/supabase-js가 realtime-js와 functions-js를 무조건 import하는데 우리 앱은 둘 다
  // 사용하지 않는다. 클라이언트 번들을 약 80~90KB 줄이기 위해 두 패키지를 가벼운 shim으로
  // 대체한다. 필요해지면 alias만 제거하면 원본이 다시 번들에 포함된다.
  turbopack: {
    resolveAlias: {
      '@supabase/realtime-js': './lib/supabase/shims/realtime-js.ts',
      '@supabase/functions-js': './lib/supabase/shims/functions-js.ts',
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@supabase/realtime-js': path.resolve(__dirname, 'lib/supabase/shims/realtime-js.ts'),
      '@supabase/functions-js': path.resolve(__dirname, 'lib/supabase/shims/functions-js.ts'),
    }
    return config
  },
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
      {
        source: '/fridge',
        destination: '/fridge-home',
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
      // Next.js는 hydration용 인라인 스크립트 필요 — nonce 미사용 시 unsafe-inline 불가피.
      // Cloudflare Web Analytics beacon은 static.cloudflareinsights.com에서 로드됨.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      // 이미지: Supabase Storage, Unsplash, Google 프로필 사진
      "img-src 'self' data: blob: https:",
      // API 연결: Supabase, Google/Kakao OAuth, Cloudflare Insights, Sentry
      [
        "connect-src 'self'",
        supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : '',
        'https://accounts.google.com',
        'https://kauth.kakao.com https://kapi.kakao.com',
        'https://cloudflareinsights.com https://static.cloudflareinsights.com',
        'https://*.sentry.io https://*.ingest.sentry.io',
      ].filter(Boolean).join(' '),
      "font-src 'self' data:",
      "frame-src 'none'",     // iframe 삽입 차단
      "object-src 'none'",    // Flash/Plugin 차단
      "base-uri 'self'",      // <base> 태그 인젝션 차단
      "form-action 'self'",   // 폼 외부 전송 차단
      // Sentry 세션 리플레이는 worker 사용
      "worker-src 'self' blob:",
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
