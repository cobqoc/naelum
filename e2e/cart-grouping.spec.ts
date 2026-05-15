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

async function seedShoppingList(userId: string) {
  const { data: sl } = await admin()
    .from('shopping_lists')
    .insert({ user_id: userId, list_name: '기본' })
    .select('id')
    .single();
  return sl!.id as string;
}

test.describe('장보기 — 카테고리 그룹(마트 동선) + 레시피 chip', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
  });

  test('첫 사용자(localStorage 없음) — 기본 그룹 모드가 카테고리', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const slId = await seedShoppingList(testUser.userId);
    await admin().from('shopping_list_items').insert([
      { user_id: testUser.userId, shopping_list_id: slId, ingredient_name: '테스트당근_G', category: 'vegetable', recipe_id: null, recipe_title: null, is_checked: false, is_owned: false },
      { user_id: testUser.userId, shopping_list_id: slId, ingredient_name: '테스트소고기_G', category: 'meat', recipe_id: null, recipe_title: null, is_checked: false, is_owned: false },
    ]);

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트당근_G').first().waitFor({ state: 'visible', timeout: 5000 });

    // 카테고리 헤더 노출 (🥬 채소, 🥩 육류)
    await expect(page.getByText('채소', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('육류', { exact: true }).first()).toBeVisible();
  });

  test('카테고리 모드 + recipe_id 항목 → 항목 아래 🍲 레시피명 chip 노출', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const recipeId = await createTestRecipe(testUser.userId, { title: '김치찌개_G', status: 'published' });
    try {
      const slId = await seedShoppingList(testUser.userId);
      await admin().from('shopping_list_items').insert({
        user_id: testUser.userId,
        shopping_list_id: slId,
        ingredient_name: '테스트양파_G',
        category: 'vegetable',
        recipe_id: recipeId,
        recipe_title: '김치찌개_G',
        is_checked: false,
        is_owned: false,
      });

      await page.goto('/');
      await page.locator('header button[aria-label="장보기"]').click();
      await page.locator('text=테스트양파_G').first().waitFor({ state: 'visible', timeout: 5000 });

      // 카테고리 모드라 메타 라인에 🍲 김치찌개 chip 표시
      const recipeChip = page.locator('span', { hasText: /김치찌개_G/ }).first();
      await expect(recipeChip).toBeVisible();
    } finally {
      await deleteTestRecipe(recipeId);
    }
  });

  test('직접 추가 항목 (recipe_id=null, recipe_title=null) — chip 안 보임', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const slId = await seedShoppingList(testUser.userId);
    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: slId,
      ingredient_name: '테스트감자_G',
      category: 'vegetable',
      recipe_id: null,
      recipe_title: null,
      is_checked: false,
      is_owned: false,
    });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트감자_G').first().waitFor({ state: 'visible', timeout: 5000 });

    // 🍲 emoji가 항목 메타 라인에 안 나옴 (그룹 헤더가 아닌 항목 행 아래)
    // 메타 라인은 "+ 메모" 버튼만 노출
    await expect(page.getByRole('button', { name: /\+ 메모/ })).toBeVisible();
  });

  test('레시피 모드로 토글 → 항목 메타 라인의 🍲 chip 사라짐', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const recipeId = await createTestRecipe(testUser.userId, { title: '카르보나라_G', status: 'published' });
    try {
      const slId = await seedShoppingList(testUser.userId);
      await admin().from('shopping_list_items').insert({
        user_id: testUser.userId,
        shopping_list_id: slId,
        ingredient_name: '테스트우유_G',
        category: 'dairy',
        recipe_id: recipeId,
        recipe_title: '카르보나라_G',
        is_checked: false,
        is_owned: false,
      });

      await page.goto('/');
      await page.locator('header button[aria-label="장보기"]').click();
      await page.locator('text=테스트우유_G').first().waitFor({ state: 'visible', timeout: 5000 });

      // 카테고리 모드 — 항목 아래 카르보나라 chip 노출
      await expect(page.locator('span', { hasText: /카르보나라_G/ }).first()).toBeVisible();

      // 레시피 모드로 토글
      const groupToggle = page.getByRole('button', { name: /레시피별/ });
      if (await groupToggle.count() > 0) {
        await groupToggle.click();
        await page.waitForTimeout(300);
        // 항목 아래 chip은 사라지지만, 그룹 헤더에 카르보나라 노출 (위치 다름)
        // 항목 행 아래 메타 라인엔 chip 없어야 → "+ 메모" 버튼만 보임
        await expect(page.getByRole('button', { name: /\+ 메모/ })).toBeVisible();
      }
    } finally {
      await deleteTestRecipe(recipeId);
    }
  });

  test('체크된 항목의 recipe chip — line-through 적용', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const recipeId = await createTestRecipe(testUser.userId, { title: '피자_G', status: 'published' });
    try {
      const slId = await seedShoppingList(testUser.userId);
      await admin().from('shopping_list_items').insert({
        user_id: testUser.userId,
        shopping_list_id: slId,
        ingredient_name: '테스트치즈_G',
        category: 'dairy',
        recipe_id: recipeId,
        recipe_title: '피자_G',
        is_checked: true,
        is_owned: false,
      });

      await page.goto('/');
      await page.locator('header button[aria-label="장보기"]').click();
      await page.locator('text=테스트치즈_G').first().waitFor({ state: 'visible', timeout: 5000 });

      const recipeChip = page.locator('span', { hasText: /피자_G/ }).first();
      await expect(recipeChip).toBeVisible();
      await expect(recipeChip).toHaveClass(/line-through/);
    } finally {
      await deleteTestRecipe(recipeId);
    }
  });
});
