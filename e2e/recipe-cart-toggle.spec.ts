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

const ING_ONION = '테스트양파토글검증';
const ING_CARROT = '테스트당근토글검증';
const ING_POTATO = '테스트감자토글검증';

async function seedRecipeIngredients(recipeId: string) {
  await admin().from('recipe_ingredients').insert([
    { recipe_id: recipeId, ingredient_name: ING_ONION,  quantity: 1, unit: '개', is_optional: false, display_order: 1 },
    { recipe_id: recipeId, ingredient_name: ING_CARROT, quantity: 2, unit: '개', is_optional: false, display_order: 2 },
    { recipe_id: recipeId, ingredient_name: ING_POTATO, quantity: 3, unit: '개', is_optional: false, display_order: 3 },
  ]);
}

test.describe('레시피 → cart 보유 재료 제외 토글', () => {
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
      { user_id: testUser.userId, ingredient_name: ING_ONION,  category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: ING_CARROT, category: 'vegetable' },
      { user_id: testUser.userId, ingredient_name: ING_POTATO, category: 'vegetable' },
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
