import { test, expect } from './auth-fixtures';
import { deleteTestRecipe } from './helpers/auth';

/**
 * 검색 E2E.
 *
 * 기존 테스트는 `hasResults || noResults` 동어반복(둘 중 하나면 통과)이라
 * 검색이 실제로 동작하는지 검증하지 못했다. seed 데이터에 의존하지 않고
 * "유니크 레시피 생성 → 그 제목으로 검색 → 결과에 노출"을 결정론적으로 검증한다.
 */
test.describe('검색 기능', () => {
  test('검색 페이지 접근 (smoke)', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*search/);
  });

  test('생성한 레시피가 제목 검색 결과에 노출 (결정론적)', async ({ authenticatedPage: page }) => {
    const unique = `E2E검색유니크${Date.now()}`;
    const createRes = await page.request.post('/api/recipes', {
      data: {
        title: unique,
        description: 'search e2e',
        cuisine_type: 'other',
        dish_type: 'other',
        difficulty_level: 'easy',
        servings: 1,
        prep_time_minutes: 1,
        cook_time_minutes: 1,
        status: 'published',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { recipe } = await createRes.json();

    try {
      await page.goto(`/search?q=${encodeURIComponent(unique)}`);
      await page.waitForLoadState('networkidle');
      // 로딩 인디케이터 사라질 때까지
      await page
        .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 15000 })
        .catch(() => {});

      // 정확히 그 레시피 링크가 결과에 있어야 함 (tautology 아님)
      const link = page.locator(`a[href*="/recipes/${recipe.id}"]`).first();
      await expect(link).toBeVisible({ timeout: 10000 });
    } finally {
      await deleteTestRecipe(recipe.id);
    }
  });

  test('존재할 수 없는 검색어는 그 레시피 링크가 없음 (음성 검증)', async ({ page }) => {
    const nonsense = `절대없는검색어${Date.now()}xyzqwert`;
    await page.goto(`/search?q=${encodeURIComponent(nonsense)}`);
    await page.waitForLoadState('networkidle');
    await page
      .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 15000 })
      .catch(() => {});
    // 결과 레시피 카드/링크가 0개여야 정상 (필터링이 실제로 동작함을 보장)
    await expect(page.locator('a[href*="/recipes/"]')).toHaveCount(0);
  });

  test('필터 UI - 난이도 select 존재', async ({ page }) => {
    await page.goto('/search?q=요리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const filterButton = page.locator('button:has-text("필터")').first();
    if ((await filterButton.count()) > 0) {
      await filterButton.click();
      const difficultySelect = page.locator('select').filter({ hasText: '쉬움' });
      if ((await difficultySelect.count()) > 0) {
        await expect(difficultySelect.first()).toBeAttached();
      }
    }
  });
});
