import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function seedItem(userId: string, opts: { name: string; checked?: boolean; note?: string | null }) {
  const { data: sl } = await admin()
    .from('shopping_lists')
    .insert({ user_id: userId, list_name: '기본' })
    .select('id')
    .single();
  await admin().from('shopping_list_items').insert({
    user_id: userId,
    shopping_list_id: sl!.id,
    ingredient_name: opts.name,
    category: 'vegetable',
    is_checked: opts.checked ?? false,
    is_owned: false,
    note: opts.note ?? null,
  });
}

test.describe('장보기 항목 메모', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
  });

  test('메모 없는 항목 — + 메모 클릭 → 입력 → Enter 저장 → DB note 반영', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    await seedItem(testUser.userId, { name: '테스트당근_메모1' });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    const row = page.locator('text=테스트당근_메모1').first();
    await row.waitFor({ state: 'visible', timeout: 5000 });

    // "+ 메모" 버튼 노출
    const addBtn = page.getByRole('button', { name: /\+ 메모/ });
    await expect(addBtn).toBeVisible();
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();

    // input 노출 + 입력 + Enter
    const input = page.getByPlaceholder('예: 유기농, 1+1');
    await expect(input).toBeFocused();
    await input.fill('유기농 우대');
    await expect(input).toHaveValue('유기농 우대');

    const patchPromise = page.waitForResponse(res =>
      res.url().includes('/api/shopping-list') && res.request().method() === 'PATCH'
    );
    await input.press('Enter');
    await expect(input).toBeHidden();
    await expect(page.locator('button', { hasText: '유기농 우대' })).toBeVisible();
    await patchPromise;

    // DB 검증
    const { data } = await admin()
      .from('shopping_list_items')
      .select('note')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트당근_메모1')
      .single();
    expect(data?.note).toBe('유기농 우대');
  });

  test('메모 있는 항목 — 클릭 → 기존값 미리 채워짐 → 수정 → blur 저장', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    await seedItem(testUser.userId, { name: '테스트양파_메모2', note: '마트A 1+1' });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트양파_메모2').first().waitFor({ state: 'visible', timeout: 5000 });

    // 기존 메모 노출 (📝 + 텍스트). aria-label로 안 쓰고 텍스트로 찾음
    const noteBtn = page.locator('button', { hasText: '마트A 1+1' });
    await expect(noteBtn).toBeVisible();
    await noteBtn.scrollIntoViewIfNeeded();
    await noteBtn.click();

    // input에 기존값 들어있음
    const input = page.getByPlaceholder('예: 유기농, 1+1');
    await expect(input).toHaveValue('마트A 1+1');

    // 수정 + blur로 저장
    await input.fill('마트B 1+2');
    await expect(input).toHaveValue('마트B 1+2');
    const patchPromise = page.waitForResponse(res =>
      res.url().includes('/api/shopping-list') && res.request().method() === 'PATCH'
    );
    await input.blur();
    await expect(input).toBeHidden();
    await expect(page.locator('button', { hasText: '마트B 1+2' })).toBeVisible();
    await patchPromise;

    const { data } = await admin()
      .from('shopping_list_items')
      .select('note')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트양파_메모2')
      .single();
    expect(data?.note).toBe('마트B 1+2');
  });

  test('메모 삭제 — 빈 문자열로 저장 → DB NULL', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    await seedItem(testUser.userId, { name: '테스트감자_메모3', note: '지울 메모' });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트감자_메모3').first().waitFor({ state: 'visible', timeout: 5000 });

    await page.locator('button', { hasText: '지울 메모' }).click();
    const input = page.getByPlaceholder('예: 유기농, 1+1');
    await input.fill('');
    await expect(input).toHaveValue('');

    const patchPromise = page.waitForResponse(res =>
      res.url().includes('/api/shopping-list') && res.request().method() === 'PATCH'
    );
    await input.press('Enter');
    await expect(input).toBeHidden();
    // 다시 "+ 메모" 버튼이 노출됨
    await expect(page.getByRole('button', { name: /\+ 메모/ })).toBeVisible();
    await patchPromise;

    const { data } = await admin()
      .from('shopping_list_items')
      .select('note')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트감자_메모3')
      .single();
    expect(data?.note).toBeNull();
  });

  test('체크된 항목 — + 메모 버튼 미노출 (메모 없을 때)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    await seedItem(testUser.userId, { name: '테스트사과_메모4', checked: true });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트사과_메모4').first().waitFor({ state: 'visible', timeout: 5000 });

    await expect(page.getByRole('button', { name: /\+ 메모/ })).toHaveCount(0);
  });

  test('200자 초과 — maxLength로 잘림', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    await seedItem(testUser.userId, { name: '테스트소고기_메모5' });

    await page.goto('/');
    await page.locator('header button[aria-label="장보기"]').click();
    await page.locator('text=테스트소고기_메모5').first().waitFor({ state: 'visible', timeout: 5000 });

    await page.getByRole('button', { name: /\+ 메모/ }).click();
    const input = page.getByPlaceholder('예: 유기농, 1+1');

    const longText = 'a'.repeat(250);
    await input.fill(longText);
    const value = await input.inputValue();
    expect(value.length).toBe(200);
  });
});
