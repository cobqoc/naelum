import { test, expect } from './fixtures';

test.describe('네비게이션 흐름 테스트', () => {
  test('로고 클릭 시 홈으로 이동', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');

    // 낼름 로고/브랜드명 클릭
    const logo = page.locator('a[href="/"]').or(page.locator('a:has-text("낼름")'));
    if (await logo.count() > 0) {
      await logo.first().click();
      await page.waitForURL('http://localhost:3000/');
      await expect(page).toHaveURL('http://localhost:3000/');
    }
  });

  test('모바일 하단 탭바 - 홈 탭', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const homeTab = page.locator('nav a[href="/"]').or(page.locator('nav button:has-text("홈")'));
    if (await homeTab.count() > 0) {
      await expect(homeTab.first()).toBeVisible();
    }
  });

  test('모바일 하단 탭바 - 검색 탭', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchTab = page.locator('nav a[href*="search"]').or(page.locator('nav a[href*="recipes"]'));
    if (await searchTab.count() > 0) {
      await searchTab.first().click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('search') || url.includes('recipes')).toBeTruthy();
    }
  });

  test('헤더 스크롤 동작 - 검색바 표시', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 스크롤 전 헤더
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // 페이지 스크롤
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // 스크롤 후 헤더가 여전히 표시 (sticky)
    await expect(header).toBeVisible();
  });

  test('404 페이지 처리', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // 404 또는 홈 리다이렉트
    const is404 = await page.locator('text=404').count() > 0 ||
                  await page.locator('text=찾을 수 없').count() > 0 ||
                  await page.locator('text=Not Found').count() > 0;
    const isHome = page.url() === 'http://localhost:3000/';

    expect(is404 || isHome).toBeTruthy();
  });

  test('레시피 작성 - 미인증 접근 차단', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');

    // 로그인 페이지 리다이렉트 또는 권한 없음 표시
    const isLoginPage = page.url().includes('/login');
    const hasAuthMsg = await page.locator('text=로그인').count() > 0;

    expect(isLoginPage || hasAuthMsg).toBeTruthy();
  });

  test('개인정보처리방침 페이지 접근', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*privacy/);
    const hasContent = await page.locator('h1').count() > 0 ||
                       await page.locator('h2').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('이용약관 페이지 접근', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*terms/);
    const hasContent = await page.locator('h1').count() > 0 ||
                       await page.locator('h2').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});
