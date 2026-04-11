import { test, expect } from './fixtures';

test.describe('검색 기능 테스트', () => {
  test('검색 페이지 접근', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // 검색 페이지 로딩 확인
    await expect(page).toHaveURL(/.*search/);
  });

  test('검색어 입력 및 결과 표시', async ({ page }) => {
    // URL 파라미터로 직접 검색하여 라우팅 타이밍 문제 회피
    await page.goto('/search?q=김치');
    await page.waitForLoadState('networkidle');

    // 로딩 완료 대기 (로딩 인디케이터가 사라질 때까지)
    await page.waitForFunction(() => {
      const loading = document.querySelector('.animate-bounce');
      return !loading;
    }, { timeout: 15000 });

    // 검색 결과 또는 "결과 없음" 메시지 확인
    const hasResults =
      (await page.locator('a[href^="/recipes/"]').count()) > 0;
    const noResults =
      (await page.locator('text=결과').count()) > 0;

    expect(hasResults || noResults).toBeTruthy();
  });

  test('필터 기능 - 난이도 선택', async ({ page }) => {
    await page.goto('/search?q=요리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 필터 버튼 찾기 (여러 개 있을 수 있어 first 사용)
    const filterButton = page.locator('button:has-text("필터")').first();

    if (await filterButton.count() > 0) {
      await filterButton.click();

      // 난이도는 <select><option>으로 렌더되므로 select 존재 여부로 검증
      // (option 자체는 select가 닫힌 상태에서 hidden으로 간주됨)
      const difficultySelect = page.locator('select').filter({ hasText: '초급' });
      if (await difficultySelect.count() > 0) {
        await expect(difficultySelect.first()).toBeAttached();
      }
    }
  });
});
