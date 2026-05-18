import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('즐겨찾기·자주 사용 재료 — Stage 2 score 기반 자동 집계', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('shopping_list_items INSERT 트리거 — favorites 자동 행 생성 + add_count=1', async ({ testUser }) => {
    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    const slId = sl!.id as string;

    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: slId,
      ingredient_name: '테스트브로콜리_F',
      category: 'vegetable',
      is_checked: false,
      is_owned: false,
    });

    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('ingredient_name, category, add_count, is_starred')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트브로콜리_F')
      .single();

    expect(data?.add_count).toBe(1);
    expect(data?.is_starred).toBe(false);
    expect(data?.category).toBe('vegetable');
  });

  test('user_ingredients INSERT 트리거 — 같은 재료 두 번 추가하면 add_count=2', async ({ testUser }) => {
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: '테스트시금치_F', category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: '테스트시금치_F', category: 'vegetable' },
    ]);

    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('add_count')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트시금치_F')
      .single();

    expect(data?.add_count).toBe(2);
  });

  test('GET /api/favorites — Stage 2 score 정렬: recent×2+total 내림차순', async ({ authenticatedPage, testUser }) => {
    // 재료별 추가 횟수:
    //  A: 총 3번 (모두 30일 이내) → score = 3*2+3 = 9
    //  B: 총 2번 (모두 오래됨) → score = 0*2+2 = 2
    //  C: 총 5번 (모두 오래됨) → score = 0*2+5 = 5
    // 기대 순서: A(9) → C(5) → B(2)
    const recentDate = new Date().toISOString();
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: 'A_recent3', category: 'vegetable', created_at: recentDate },
      { user_id: testUser.userId, ingredient_name: 'A_recent3', category: 'vegetable', created_at: recentDate },
      { user_id: testUser.userId, ingredient_name: 'A_recent3', category: 'vegetable', created_at: recentDate },
      { user_id: testUser.userId, ingredient_name: 'B_old2', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'B_old2', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'C_old5', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'C_old5', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'C_old5', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'C_old5', category: 'vegetable', created_at: oldDate },
      { user_id: testUser.userId, ingredient_name: 'C_old5', category: 'vegetable', created_at: oldDate },
    ]);

    const res = await authenticatedPage.request.get('/api/favorites?limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const names: string[] = body.items.map((i: { ingredient_name: string }) => i.ingredient_name);
    expect(names).toEqual(['A_recent3', 'C_old5', 'B_old2']);
  });

  test('POST /api/favorites/sync — localStorage 데이터 일괄 upsert', async ({ authenticatedPage, testUser }) => {
    const res = await authenticatedPage.request.post('/api/favorites/sync', {
      data: {
        items: [
          { ingredient_name: '동기화_재료1', category: 'vegetable', count: 5 },
          { ingredient_name: '동기화_재료2', category: 'meat', count: 3 },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(2);

    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('ingredient_name, add_count')
      .eq('user_id', testUser.userId)
      .in('ingredient_name', ['동기화_재료1', '동기화_재료2']);
    const map = new Map((data ?? []).map(d => [d.ingredient_name, d.add_count]));
    expect(map.get('동기화_재료1')).toBe(5);
    expect(map.get('동기화_재료2')).toBe(3);
  });

  test('cart 빈 상태 — 자주 쓰는 재료 칩 노출 (별표 버튼 없음)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // user_ingredients에 재료 시드 → GET /api/favorites가 이 데이터로 응답
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: '자주사용재료_F', category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: '자주사용재료_F', category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: '자주사용재료_F', category: 'vegetable' },
    ]);

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();

    const quickAddArea = page.locator('[data-testid="cart-quick-add"]');
    await expect(quickAddArea).toBeVisible({ timeout: 5000 });

    // favorites 항목 노출
    const item = quickAddArea.locator('button', { hasText: '자주사용재료_F' }).first();
    await expect(item).toBeVisible();

    // ⭐ 별표 버튼 없음 (Stage 2에서 제거됨)
    const starBtn = quickAddArea.getByRole('button', { name: /즐겨찾기/ });
    await expect(starBtn).not.toBeVisible();
  });
});
