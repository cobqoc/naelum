import { test, expect } from './auth-fixtures';

/**
 * Header dropdown 5곳 focus trap (Phase A — a11y 라운드).
 *
 * 동작 (모든 dropdown 공통):
 *  - panel 열린 상태에서 Tab/Shift+Tab 이 panel 안에서 순환 (밖으로 안 나감)
 *  - ESC 로 닫힐 때 focus 가 trigger 로 복원
 *
 * 안전망 선작성 — useFocusTrap hook 없으면 baseline fail.
 */
test.describe('Header dropdown — focus trap', () => {
  test.describe('비로그인', () => {
    test('More menu — Tab focus trap + ESC 후 trigger 복원', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="더보기"]');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Tab 여러번 → focus 가 panel 안에 머무름 (밖으로 안 나감)
      for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');

      const focusInPanel = await page.evaluate(() => {
        const panel = document.querySelector('header div.w-52');
        return panel?.contains(document.activeElement) ?? false;
      });
      expect(focusInPanel).toBe(true);

      // ESC → 닫힘 + trigger focus 복원
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });

    test('LangSelector — Tab focus trap + ESC 후 trigger 복원', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="언어 선택"]').first();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');

      const focusInPanel = await page.evaluate(() => {
        const panel = document.querySelector('header div.w-44');
        return panel?.contains(document.activeElement) ?? false;
      });
      expect(focusInPanel).toBe(true);

      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });
  });

  test.describe('로그인', () => {
    test('ShoppingCart — Tab focus trap + ESC 후 trigger 복원', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="장보기"]');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');

      const focusInPanel = await page.evaluate(() => {
        // ShoppingCart PC: w-80 md:w-[30rem] — md+ viewport 라 w-[30rem]
        const panel = document.querySelector('header div[class*="w-[30rem]"]');
        return panel?.contains(document.activeElement) ?? false;
      });
      expect(focusInPanel).toBe(true);

      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });

    test('NotificationPanel — Tab focus trap + ESC 후 trigger 복원', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="알림"]').first();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');

      const focusInPanel = await page.evaluate(() => {
        const panel = document.querySelector('header div.w-80');
        return panel?.contains(document.activeElement) ?? false;
      });
      expect(focusInPanel).toBe(true);

      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });

    test('UserDropdown — Tab focus trap + ESC 후 trigger 복원', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="프로필 메뉴"]').first();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');

      const focusInPanel = await page.evaluate(() => {
        const panel = document.querySelector('header div.w-56');
        return panel?.contains(document.activeElement) ?? false;
      });
      expect(focusInPanel).toBe(true);

      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });
  });
});
