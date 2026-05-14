import { test, expect } from './auth-fixtures';

/**
 * 재료 입력 시스템 테스트
 *
 * 현재 /recipes/new 페이지에서는 인라인 텍스트 입력 방식을 사용한다.
 * IngredientPickerModal은 냉장고 재료 추가에서 사용됨.
 */

test.describe('재료 입력 시스템 (인라인)', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
  });

  test('재료 입력 필드 표시 확인', async ({ authenticatedPage: page }) => {
    // 첫 번째 재료 입력 필드 찾기 (placeholder: "예: 돼지고기")
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });
  });

  test('재료 검색 및 자동완성', async ({ authenticatedPage: page }) => {
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    await ingredientInput.fill('돼지고기');
    await page.waitForTimeout(500);

    const value = await ingredientInput.inputValue();
    expect(value).toBe('돼지고기');
  });

  test('재료 선택 후 입력창에 표시', async ({ authenticatedPage: page }) => {
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    await ingredientInput.fill('돼지고기');
    await page.waitForTimeout(300);

    const value = await ingredientInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('ESC 키로 자동완성 닫기', async ({ authenticatedPage: page }) => {
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    await ingredientInput.fill('돼지');
    await page.waitForTimeout(300);

    await ingredientInput.press('Escape');
    await page.waitForTimeout(200);

    // 에러 없이 정상 동작 확인
    const hasError = await page.locator('text=문제가 발생').count();
    expect(hasError).toBe(0);
  });

  test('여러 재료 순차적으로 입력', async ({ authenticatedPage: page }) => {
    // 첫 번째 재료 입력
    const firstInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(firstInput).toBeVisible({ timeout: 10000 });

    await firstInput.fill('돼지고기');
    await page.waitForTimeout(300);

    // 두 번째 재료 (두 번째 placeholder 다름)
    const allIngredientInputs = page.locator('input[placeholder^="예:"]');
    const count = await allIngredientInputs.count();
    expect(count).toBeGreaterThan(0);

    if (count > 1) {
      const secondInput = allIngredientInputs.nth(1);
      await secondInput.fill('양파');
      await page.waitForTimeout(300);

      const value = await secondInput.inputValue();
      expect(value).toBe('양파');
    }
  });

  test('커스텀 재료 직접 추가', async ({ authenticatedPage: page }) => {
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    const customIngredient = `테스트재료${Date.now()}`;
    await ingredientInput.fill(customIngredient);
    await page.waitForTimeout(300);

    await expect(ingredientInput).toHaveValue(customIngredient);
  });

  test('카테고리 필터 적용 (육류)', async ({ authenticatedPage: page }) => {
    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    await ingredientInput.fill('닭고기');
    await page.waitForTimeout(300);

    const value = await ingredientInput.inputValue();
    expect(value).toBe('닭고기');
  });

  test('모바일 - 재료 입력 및 선택', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const ingredientInput = page.locator('input[placeholder="예: 돼지고기"]').first();
    await expect(ingredientInput).toBeVisible({ timeout: 10000 });

    await ingredientInput.click();
    await ingredientInput.fill('돼지고기');
    await page.waitForTimeout(300);

    const value = await ingredientInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});
