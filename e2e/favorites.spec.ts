import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function seedShoppingList(userId: string) {
  const { data: sl } = await admin()
    .from('shopping_lists')
    .insert({ user_id: userId, list_name: '기본' })
    .select('id')
    .single();
  return sl!.id as string;
}

test.describe('즐겨찾기·자주 사용 재료 — 자동 집계 + ⭐ 토글', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('shopping_list_items INSERT 트리거 — favorites 자동 행 생성 + add_count=1', async ({ testUser }) => {
    const slId = await seedShoppingList(testUser.userId);
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

  test('GET /api/favorites — 정렬: starred → add_count → last_added_at', async ({ authenticatedPage, testUser }) => {
    // count=3 (별표 안 됨), count=10 (별표 안 됨), count=1 (별표 됨)
    // 기대 순서: count=1 별표 → count=10 → count=3
    await admin().from('user_favorites_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: 'A_count3', category: 'vegetable', add_count: 3, is_starred: false },
      { user_id: testUser.userId, ingredient_name: 'B_count10', category: 'vegetable', add_count: 10, is_starred: false },
      { user_id: testUser.userId, ingredient_name: 'C_starred_count1', category: 'vegetable', add_count: 1, is_starred: true },
    ]);

    const res = await authenticatedPage.request.get('/api/favorites?limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const names: string[] = body.items.map((i: { ingredient_name: string }) => i.ingredient_name);
    expect(names).toEqual(['C_starred_count1', 'B_count10', 'A_count3']);
  });

  test('PATCH /api/favorites — ⭐ 토글 → DB is_starred 갱신', async ({ authenticatedPage, testUser }) => {
    await admin().from('user_favorites_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '테스트토마토_F',
      category: 'vegetable',
      add_count: 1,
      is_starred: false,
    });

    const res = await authenticatedPage.request.patch('/api/favorites', {
      data: { ingredient_name: '테스트토마토_F', is_starred: true, category: 'vegetable' },
    });
    expect(res.status()).toBe(200);

    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('is_starred')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트토마토_F')
      .single();
    expect(data?.is_starred).toBe(true);
  });

  test('PATCH /api/favorites — 행이 없으면 새로 생성', async ({ authenticatedPage, testUser }) => {
    const res = await authenticatedPage.request.patch('/api/favorites', {
      data: { ingredient_name: '테스트새재료_F', is_starred: true, category: 'fruit' },
    });
    expect(res.status()).toBe(200);

    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('is_starred, category, add_count')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트새재료_F')
      .single();
    expect(data?.is_starred).toBe(true);
    expect(data?.category).toBe('fruit');
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

  test('cart 빈 상태 — ⭐ 토글 가능 (UI 통합)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // favorites 미리 1개 시드 → cart 빈 상태 quick-add에 노출
    await admin().from('user_favorites_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '즐겨찾기재료_F',
      category: 'vegetable',
      add_count: 5,
      is_starred: false,
    });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    // cart 비어있어서 quick-add 영역 보임
    await expect(page.getByText(/자주 추가하는 재료|Frequently added/i)).toBeVisible({ timeout: 5000 });

    // favorites 항목 노출
    const item = page.locator('button', { hasText: '즐겨찾기재료_F' }).first();
    await expect(item).toBeVisible();

    // ⭐ 토글 버튼 (aria-pressed=false 상태)
    const starBtn = page.getByRole('button', { name: /즐겨찾기 추가/ }).first();
    await expect(starBtn).toBeVisible();
    await starBtn.click();

    // PATCH 완료 → DB 검증
    await page.waitForTimeout(500);
    const { data } = await admin()
      .from('user_favorites_ingredients')
      .select('is_starred')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '즐겨찾기재료_F')
      .single();
    expect(data?.is_starred).toBe(true);
  });
});
