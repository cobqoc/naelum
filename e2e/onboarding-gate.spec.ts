import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * C1 회귀 가드 — 약관/온보딩 미동의(onboarding_completed=false) 세션이
 * 변경(mutating) API 를 직접 호출하지 못하게 미들웨어 게이트가 막는지 검증.
 *
 * 과거 버그: 미들웨어 게이트가 `/api/*` 를 통째로 제외해, 미동의 세션이 페이지
 * 게이트를 우회해 POST/PUT/PATCH/DELETE 로 쓰기를 할 수 있었다(동의 강제 무력화).
 *
 * 게이트 정책(proxy.ts):
 *  - 미동의 + 변경 API(/api/auth 제외) → 403 onboarding_required
 *  - 읽기(GET)·/api/auth/* 는 통과 (온보딩 완료/탈출에 필요)
 *  - 온보딩 완료 후엔 정상 통과
 */
test.describe('온보딩 게이트 — 미동의 세션 쓰기 API 차단 (C1)', () => {
  test('미동의 → 변경 API 403 / GET 허용 / 동의 복구 시 통과', async ({ authenticatedPage, testUser }) => {
    const a = admin();

    // 1. 세션은 유효한 채 프로필만 미동의 상태로 전환 (게이트는 매 요청 DB 조회)
    await a.from('profiles').update({ onboarding_completed: false }).eq('id', testUser.userId);

    try {
      // 2. 변경 API(POST) → 403 onboarding_required (미들웨어가 라우트 도달 전 차단)
      const post = await authenticatedPage.request.post('/api/user-ingredients', {
        data: { ingredient_name: '게이트테스트', category: 'veggie' },
      });
      expect(post.status()).toBe(403);
      const body = await post.json().catch(() => ({} as { error?: string }));
      expect(body.error).toBe('onboarding_required');

      // 3. 읽기 API(GET) 는 게이트 통과 (403 아님)
      const get = await authenticatedPage.request.get('/api/user-ingredients');
      expect(get.status()).not.toBe(403);

      // 4. DELETE(변경)도 차단되는지 — 임의 id, 게이트가 라우트 전에 막으므로 403
      const del = await authenticatedPage.request.delete('/api/user-ingredients/00000000-0000-0000-0000-000000000000');
      expect(del.status()).toBe(403);
    } finally {
      // 5. 온보딩 완료 복구
      await a.from('profiles').update({ onboarding_completed: true, onboarding_step: 4 }).eq('id', testUser.userId);
    }

    // 6. 동의 복구 후 같은 변경 API → 더는 403 아님 (게이트가 원인이었음을 증명)
    const postAfter = await authenticatedPage.request.post('/api/user-ingredients', {
      data: { ingredient_name: '게이트테스트복구', category: 'veggie' },
    });
    expect(postAfter.status()).not.toBe(403);

    // cleanup — 테스트로 추가된 재료 제거
    await admin()
      .from('user_ingredients')
      .delete()
      .eq('user_id', testUser.userId)
      .in('ingredient_name', ['게이트테스트', '게이트테스트복구']);
  });
});
