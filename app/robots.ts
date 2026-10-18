import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

// 단일 출처 — 예전엔 public/robots.txt(봇별 규칙)와 이 파일이 따로 있었고 실제로는 이 파일만 서빙됐다.
// 실제 페이지 URL 은 항상 /{lang}/… 라 lang 없는 Disallow('/settings' 등)는 하나도 맞지 않았다 → '/*/' 와일드카드
// (Google·Bing 지원)를 함께 둔다(2026-10-19 감사 PAU-53). AI 크롤러는 proxy.ts BLOCKED_AI_CRAWLERS 가 403 으로도 막는다.
const PRIVATE_PATHS = [
  '/api/',
  '/admin', '/*/admin',
  '/settings', '/*/settings',
  '/auth/', '/*/auth/',
  '/signup/set-password', '/*/signup/set-password',
  '/cart/share/', '/*/cart/share/',
];

const AI_AND_SCRAPER_BOTS = [
  'GPTBot', 'ChatGPT-User', 'Google-Extended', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Bytespider',
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'DataForSeoBot', 'PetalBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_AND_SCRAPER_BOTS, disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
