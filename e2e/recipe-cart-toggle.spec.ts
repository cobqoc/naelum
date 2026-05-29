import { test, expect } from './auth-fixtures';
import { createTestRecipe, deleteTestRecipe } from './helpers/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * 레시피 → cart 보유 재료 제외 토글 (V2 매칭 회귀 안전망)
 *
 * **V2 재설계 (2026-05-29, [[ingredient-match-v2-redesign]])**:
 *  - 보유 판정은 *ingredient_id* 정확 일치만 — 이름 매칭·정규화·레벤슈타인 전부 제거.
 *  - 따라서 이 테스트는 `ingredients_master` 행을 시드한 뒤
 *    recipe_ingredients·user_ingredients 둘 다 같은 master id 로 링크해야
 *    isIngredientOwned 가 true 가 된다 (이름만 같아선 매칭 안 됨).
 *  - 옛 테스트가 쓰던 "이름이 서로 안 닮아야 한다(레벤슈타인 0.7)" 제약은 폐기 —
 *    id 기반이라 이름 유사도는 매칭에 영향 없음.
 *
 * 잠그는 불변식:
 *  1. 보유 0개 → 토글 미노출 + cart 클릭 시 전체 재료 전송
 *  2. 보유 1개 + 토글 OFF(기본) → 전체 재료 전송
 *  3. 보유 1개 + 토글 ON → 보유 재료 제외하고 전송 + skip 토스트
 *  4. 전부 보유 + 토글 ON → cartAllOwned 토스트 + POST 없음
 */

// V2 매칭은 id 기반이라 이름 유사도 무관. 읽기 쉬운 이름 사용.
//
// **worker 별 고유 이름 필수**: ingredients_master.name 에 unique 제약이 있고
// 병렬 worker 들이 같은 이름을 delete+insert 하면 한 worker 의 insert 가 다른
// worker 의 master row 를 지워(FK ON DELETE SET NULL) ingredient_id 링크가 끊김
// → 보유 매칭 실패(flaky). workerIndex 를 suffix 로 붙여 worker 마다 독립 행 보유.
let onionId = '';
let carrotId = '';
let potatoId = '';

// beforeAll 에서 workerIndex 기반으로 채움 — seed·assert 양쪽에서 사용
let ING_ONION = '';
let ING_CARROT = '';
let ING_POTATO = '';

/** 레시피에 3개 재료를 master id 로 링크해 삽입 (V2 정확 매칭 전제) */
async function seedRecipeIngredients(recipeId: string) {
  await admin().from('recipe_ingredients').insert([
    { recipe_id: recipeId, ingredient_id: onionId,  ingredient_name: ING_ONION,  quantity: 1, unit: '개', is_optional: false, display_order: 1 },
    { recipe_id: recipeId, ingredient_id: carrotId, ingredient_name: ING_CARROT, quantity: 2, unit: '개', is_optional: false, display_order: 2 },
    { recipe_id: recipeId, ingredient_id: potatoId, ingredient_name: ING_POTATO, quantity: 3, unit: '개', is_optional: false, display_order: 3 },
  ]);
}

test.describe('레시피 → cart 보유 재료 제외 토글', () => {
  test.beforeAll(async ({}, testInfo) => {
    const sfx = `_w${testInfo.workerIndex}`;
    ING_ONION = `E2E양파${sfx}`;
    ING_CARROT = `E2E당근${sfx}`;
    ING_POTATO = `E2E감자${sfx}`;
    const names = [ING_ONION, ING_CARROT, ING_POTATO];
    // 잔여 master 행 제거 후 재삽입 (worker 고유 이름 → 다른 worker 와 충돌 없음, FK SET NULL)
    await admin().from('ingredients_master').delete().in('name', names);
    const { data, error } = await admin()
      .from('ingredients_master')
      .insert(names.map(name => ({ name, category: 'veggie', status: 'approved' })))
      .select('id, name');
    if (error || !data) throw new Error(`master seed failed: ${error?.message}`);
    const byName = new Map(data.map(r => [r.name as string, r.id as string]));
    onionId = byName.get(ING_ONION)!;
    carrotId = byName.get(ING_CARROT)!;
    potatoId = byName.get(ING_POTATO)!;
  });

  test.afterAll(async () => {
    await admin().from('ingredients_master').delete().in('name', [ING_ONION, ING_CARROT, ING_POTATO]);
  });

  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('보유 0개: 토글 UI 미노출 + cart 클릭 시 전체 재료 전송', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Cart Toggle Empty ${Date.now()}`,
      status: 'published',
    });
    await seedRecipeIngredients(recipeId);

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' });
      const cartBtn = page.getByRole('button', { name: /장보기/ });
      await cartBtn.waitFor({ state: 'visible', timeout: 10000 });

      await expect(page.getByText('냉장고에 있는 재료 제외', { exact: false })).toHaveCount(0);

      const reqPromise = page.waitForRequest(req =>
        req.url().includes('/api/shopping-list') && req.method() === 'POST'
      );
      await cartBtn.click();
      const req = await reqPromise;
      const payload = JSON.parse(req.postData() || '{}');
      expect(payload.ingredients?.length).toBe(3);
      const names = payload.ingredients.map((i: { ingredient_name: string }) => i.ingredient_name);
      expect(names).toEqual(expect.arrayContaining([ING_ONION, ING_CARROT, ING_POTATO]));
    } finally {
      await admin().from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await deleteTestRecipe(recipeId);
    }
  });

  test('보유 1개 + 토글 OFF (기본): 전체 재료 전송', async ({ authenticatedPage: page, testUser }) => {
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: ING_ONION,
      ingredient_id: onionId,
      category: 'vegetable',
    });

    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Cart Toggle Off ${Date.now()}`,
      status: 'published',
    });
    await seedRecipeIngredients(recipeId);

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /장보기/ }).waitFor({ state: 'visible', timeout: 10000 });

      await expect(page.getByText('냉장고에 있는 재료 제외 (1)', { exact: false })).toBeVisible({ timeout: 5000 });

      const checkbox = page.locator('label').filter({ hasText: '냉장고에 있는 재료 제외' }).locator('input[type="checkbox"]');
      await expect(checkbox).not.toBeChecked();

      const reqPromise = page.waitForRequest(req =>
        req.url().includes('/api/shopping-list') && req.method() === 'POST'
      );
      await page.getByRole('button', { name: /장보기/ }).click();
      const req = await reqPromise;
      const payload = JSON.parse(req.postData() || '{}');
      expect(payload.ingredients?.length).toBe(3);
    } finally {
      await admin().from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await deleteTestRecipe(recipeId);
    }
  });

  test('보유 1개 + 토글 ON: 보유 재료 제외하고 전송 + skip 토스트', async ({ authenticatedPage: page, testUser }) => {
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: ING_ONION,
      ingredient_id: onionId,
      category: 'vegetable',
    });

    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Cart Toggle On ${Date.now()}`,
      status: 'published',
    });
    await seedRecipeIngredients(recipeId);

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /장보기/ }).waitFor({ state: 'visible', timeout: 10000 });

      const checkbox = page.locator('label').filter({ hasText: '냉장고에 있는 재료 제외' }).locator('input[type="checkbox"]');
      await expect(checkbox).toBeVisible({ timeout: 5000 });
      await checkbox.check();
      await expect(checkbox).toBeChecked();

      const reqPromise = page.waitForRequest(req =>
        req.url().includes('/api/shopping-list') && req.method() === 'POST'
      );
      await page.getByRole('button', { name: /장보기/ }).click();
      const req = await reqPromise;
      const payload = JSON.parse(req.postData() || '{}');

      expect(payload.ingredients?.length).toBe(2);
      const names = payload.ingredients.map((i: { ingredient_name: string }) => i.ingredient_name);
      expect(names).not.toContain(ING_ONION);
      expect(names).toEqual(expect.arrayContaining([ING_CARROT, ING_POTATO]));

      await expect(page.getByText(/보유 1개 제외/)).toBeVisible({ timeout: 5000 });
    } finally {
      await admin().from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await deleteTestRecipe(recipeId);
    }
  });

  test('전부 보유 + 토글 ON: cartAllOwned 토스트 + /api/shopping-list 호출 없음', async ({ authenticatedPage: page, testUser }) => {
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: ING_ONION,  ingredient_id: onionId,  category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: ING_CARROT, ingredient_id: carrotId, category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: ING_POTATO, ingredient_id: potatoId, category: 'vegetable' },
    ]);

    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Cart Toggle All Owned ${Date.now()}`,
      status: 'published',
    });
    await seedRecipeIngredients(recipeId);

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /장보기/ }).waitFor({ state: 'visible', timeout: 10000 });

      await expect(page.getByText('냉장고에 있는 재료 제외 (3)', { exact: false })).toBeVisible({ timeout: 5000 });

      const checkbox = page.locator('label').filter({ hasText: '냉장고에 있는 재료 제외' }).locator('input[type="checkbox"]');
      await checkbox.check();

      let cartPostCount = 0;
      page.on('request', req => {
        if (req.url().includes('/api/shopping-list') && req.method() === 'POST') cartPostCount++;
      });

      await page.getByRole('button', { name: /장보기/ }).click();
      await expect(page.getByText('모든 재료가 이미 냉장고에 있어요')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);
      expect(cartPostCount).toBe(0);
    } finally {
      await admin().from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await deleteTestRecipe(recipeId);
    }
  });
});
