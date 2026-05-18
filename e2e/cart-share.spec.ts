import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('공유 cart (Phase 1 read-only)', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('shopping_list_shares').delete().eq('owner_user_id', testUser.userId);
  });

  test('토큰 생성 → 재사용 → 공유 페이지 read-only → revoke → 만료', async ({
    authenticatedPage,
    browser,
  }) => {
    const page = authenticatedPage;

    // 1. cart에 항목 추가
    const addRes = await page.request.post('/api/shopping-list', {
      data: {
        recipeId: null,
        recipeTitle: '직접 추가',
        ingredients: [{ ingredient_name: '테스트양파', category: 'veggie', unit: '개' }],
      },
    });
    expect(addRes.ok()).toBeTruthy();

    // 2. 공유 토큰 생성
    const shareRes = await page.request.post('/api/cart/share');
    expect(shareRes.ok()).toBeTruthy();
    const { token } = await shareRes.json();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(8);

    // 3. 재호출 시 같은 토큰 (사용자당 활성 토큰 1개 재사용)
    const shareRes2 = await page.request.post('/api/cart/share');
    const { token: token2 } = await shareRes2.json();
    expect(token2).toBe(token);

    // 4. 비인증 컨텍스트로 공유 페이지 접근 → read-only 표시
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`/ko/cart/share/${token}`);
    await expect(anonPage.getByText('테스트양파')).toBeVisible();
    await expect(anonPage.getByText('읽기 전용', { exact: false })).toBeVisible();

    // 5. GET API 직접 검증 (비인증)
    const getRes = await anonPage.request.get(`/api/cart/share/${token}`);
    expect(getRes.ok()).toBeTruthy();
    const data = await getRes.json();
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items.some((i: { ingredient_name: string }) => i.ingredient_name === '테스트양파')).toBeTruthy();

    // 6. revoke
    const delRes = await page.request.delete('/api/cart/share');
    expect(delRes.ok()).toBeTruthy();

    // 7. revoke 후 공유 페이지 → 만료 화면
    await anonPage.goto(`/ko/cart/share/${token}`);
    await expect(anonPage.getByText('링크를 찾을 수 없어요')).toBeVisible();

    // 8. revoke 후 GET API → 404
    const getRes2 = await anonPage.request.get(`/api/cart/share/${token}`);
    expect(getRes2.status()).toBe(404);

    // 9. revoke 후 다시 생성하면 새 토큰
    const shareRes3 = await page.request.post('/api/cart/share');
    const { token: token3 } = await shareRes3.json();
    expect(token3).not.toBe(token);

    await anonContext.close();
  });

  test('잘못된 토큰 → 만료 안내 화면', async ({ page }) => {
    await page.goto('/ko/cart/share/invalidtoken12345');
    await expect(page.getByText('링크를 찾을 수 없어요')).toBeVisible();
  });

  test('비로그인 사용자 POST → 401', async ({ page }) => {
    const res = await page.request.post('/api/cart/share');
    expect(res.status()).toBe(401);
  });
});
