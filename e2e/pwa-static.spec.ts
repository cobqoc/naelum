import { test, expect } from './auth-fixtures';

/**
 * proxy.ts 정적 PWA 자산 통과(STATIC_PASSTHROUGH) 회귀 안전망 (perf 2026-09-27).
 *
 * /sw.js·/manifest.json·/offline.html 은 세션 갱신·온보딩 게이트 없이 통과하되 응답은 기존과 동일해야 한다:
 *  - 비로그인: 200, no-store 없음 (원래도 세션 쿠키 없으면 no-store 를 붙이지 않았다)
 *  - 로그인(세션 쿠키): 200, `no-store, must-revalidate` (원래 applyNoStore 가 붙이던 값 그대로)
 *  - 게이트는 페이지 요청에서 그대로 작동: bare /recipes 는 여전히 locale 307, 로그인 /ko/recipes 는 여전히 no-store
 * 로컬 `next start` 의 정적 파일 기본 Cache-Control 은 Vercel 과 달라서 값 자체가 아니라 no-store 유무만 단언한다.
 */
const STATIC_FILES: Array<[string, RegExp]> = [
  ['/sw.js', /javascript/],
  ['/manifest.json', /json/],
  ['/offline.html', /html/],
];

test.describe('정적 PWA 자산 — proxy 통과', () => {
  test('비로그인: 200 + no-store 없음 + 리다이렉트 없음', async ({ page }) => {
    for (const [path, ct] of STATIC_FILES) {
      const r = await page.request.get(path, { maxRedirects: 0 });
      expect(r.status(), path).toBe(200);
      expect(r.headers()['content-type'] ?? '', path).toMatch(ct);
      expect(r.headers()['cache-control'] ?? '', path).not.toContain('no-store');
    }
  });

  test('로그인: 200 + no-store 유지(헤더 동일) + 리다이렉트 없음', async ({ authenticatedPage }) => {
    for (const [path, ct] of STATIC_FILES) {
      const r = await authenticatedPage.request.get(path, { maxRedirects: 0 });
      expect(r.status(), path).toBe(200);
      expect(r.headers()['content-type'] ?? '', path).toMatch(ct);
      expect(r.headers()['cache-control'] ?? '', path).toBe('no-store, must-revalidate');
    }
  });

  test('게이트 불변: bare 경로 locale 307(비로그인), 로그인 페이지 no-store', async ({ request, authenticatedPage }) => {
    // `page`+`authenticatedPage` 동시 사용 금지 — authenticatedPage 는 같은 컨텍스트의 page 라 page.request 도 인증됨.
    // 쿠키 없는 비로그인 요청은 컨텍스트와 무관한 built-in `request` 픽스처로.
    const bare = await request.get('/recipes', { maxRedirects: 0 });
    expect(bare.status()).toBe(307);
    expect(bare.headers()['location'] ?? '').toMatch(/\/(ko|en|ja|zh|es|fr|de|it)\/recipes$/);

    const authed = await authenticatedPage.request.get('/ko/recipes', { maxRedirects: 0 });
    expect(authed.status()).toBe(200);
    expect(authed.headers()['cache-control'] ?? '').toContain('no-store');
  });
});
