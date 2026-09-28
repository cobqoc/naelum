import { test, expect } from './auth-fixtures';
import { setUserRole } from './helpers/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * proxy.ts 게이트 회귀 안전망 (perf 2026-09-27 — 미들웨어 인증 경로 최적화 *전에* 작성·baseline 확인).
 *
 * 최적화 대상:
 *  - 읽기 API(GET /api/*) 에서 미들웨어 getUser 생략 — 라우트가 스스로 인증
 *  - 보호/관리자 경로의 banned·role·onboarding 조회 병렬화
 * 이 스펙은 그 과정에서 절대 바뀌면 안 되는 관측 가능한 결과를 고정한다:
 *  1. 로그인 읽기 API: 200 + 올바른 사용자 데이터 + Cache-Control no-store
 *  2. 비로그인 보호 경로 → /signin?redirect=
 *  3. 비관리자 /admin → 홈 307, 관리자 /admin → 200
 *  4. 온보딩 미완료: 페이지 → terms-agreement 307(보호 경로 포함), 읽기 API 는 통과
 *
 * testUser 는 worker 공유 → 역할/온보딩 변경은 반드시 finally 에서 원복.
 */
function admin() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('proxy 게이트 — 미들웨어 인증 최적화 안전망', () => {
  test('로그인 읽기 API: 라우트 자체 인증으로 200 + 본인 데이터 + no-store', async ({ authenticatedPage, testUser }) => {
    const summary = await authenticatedPage.request.get('/api/users/me/summary');
    expect(summary.status()).toBe(200);
    expect(summary.headers()['cache-control'] ?? '').toContain('no-store');
    const body = await summary.json();
    expect(body.profile?.username).toBe(testUser.username);

    const ings = await authenticatedPage.request.get('/api/user-ingredients');
    expect(ings.status()).toBe(200);
    expect(ings.headers()['cache-control'] ?? '').toContain('no-store');
  });

  test('비로그인: 보호 경로는 signin 으로, 읽기 API 는 401', async ({ request }) => {
    const r = await request.get('/ko/recipes/new', { maxRedirects: 0 });
    expect(r.status()).toBe(307);
    expect(r.headers()['location'] ?? '').toMatch(/\/ko\/signin\?redirect=%2Fko%2Frecipes%2Fnew$/);

    const api = await request.get('/api/users/me/summary');
    expect(api.status()).toBe(401);
  });

  test('비로그인 위조 x-naelum-user-id 헤더는 무시된다 (홈 SSR 이 로그인으로 취급하지 않음)', async ({ request }) => {
    const plain = await (await request.get('/ko')).text();
    expect(plain).toContain('isAuthenticated\\":false');
    const forged = await request.get('/ko', {
      headers: { 'x-naelum-user-id': '00000000-0000-0000-0000-000000000001' },
    });
    expect(forged.status()).toBe(200);
    const body = await forged.text();
    expect(body).toContain('isAuthenticated\\":false');
    expect(body).not.toContain('isAuthenticated\\":true');
  });

  test('관리자 게이트: 비관리자 → 홈 307, 관리자 → 200', async ({ authenticatedPage, testUser }) => {
    const denied = await authenticatedPage.request.get('/ko/admin', { maxRedirects: 0 });
    expect(denied.status()).toBe(307);
    expect(denied.headers()['location'] ?? '').toMatch(/\/ko\/?$/);

    await setUserRole(testUser.userId, 'admin');
    try {
      const allowed = await authenticatedPage.request.get('/ko/admin', { maxRedirects: 0 });
      expect(allowed.status()).toBe(200);
    } finally {
      await setUserRole(testUser.userId, 'user');
    }
  });

  test('온보딩 미완료: 일반·보호 페이지 → terms-agreement, 읽기 API 통과', async ({ authenticatedPage, testUser }) => {
    const a = admin();
    await a.from('profiles').update({ onboarding_completed: false }).eq('id', testUser.userId);
    try {
      for (const path of ['/ko/recipes', '/ko/recipes/new']) {
        const r = await authenticatedPage.request.get(path, { maxRedirects: 0 });
        expect(r.status(), path).toBe(307);
        expect(r.headers()['location'] ?? '', path).toMatch(/\/ko\/auth\/terms-agreement$/);
      }
      const api = await authenticatedPage.request.get('/api/user-ingredients');
      expect(api.status()).toBe(200);
    } finally {
      await a.from('profiles').update({ onboarding_completed: true, onboarding_step: 4 }).eq('id', testUser.userId);
    }
    // 복구 후 정상 통과
    const ok = await authenticatedPage.request.get('/ko/recipes/new', { maxRedirects: 0 });
    expect(ok.status()).toBe(200);
  });
});
