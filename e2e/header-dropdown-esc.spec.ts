import { test, expect } from './auth-fixtures';

/**
 * Header dropdown 5곳 ESC 키 a11y baseline.
 *
 * 본격 modal(ConfirmDialog·AddIngredientModal·AuthPromptSheet·FridgeAllSheet)은
 * 이미 useEscapeKey 처리. Header 의 작은 dropdown 들은 미지원 갭 — useOutsideClick 만 함.
 * 이 spec 은 5곳에 useEscapeKey(onClose, isOpen) 한 줄씩 추가한 후 통과해야 함.
 *
 * 대상:
 *  - More menu (Header/index.tsx, 비로그인 노출)
 *  - LangSelector (Header/index.tsx, 비로그인 노출)
 *  - ShoppingCartDropdown (로그인)
 *  - NotificationPanel (로그인)
 *  - UserDropdown (로그인)
 */
test.describe('Header dropdown — ESC 처리', () => {
  test.describe('비로그인 dropdown', () => {
    test('More menu — ESC 로 닫힘', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="더보기"]');
      await trigger.click();

      // 열림 확인 — aria-expanded + 패널 안 약관(/terms) 링크 노출
      // (More menu 패널: terms·privacy·copyright 만, cookies 는 footer)
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const termsLink = page.locator('header a[href*="/terms"]').first();
      await expect(termsLink).toBeVisible();

      // ESC
      await page.keyboard.press('Escape');

      // 닫힘 확인
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(termsLink).toBeHidden();
    });

    test('LangSelector — ESC 로 닫힘', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trigger = page.locator('header button[aria-label="언어 선택"]').first();
      await trigger.click();

      // 열림 확인 — aria-expanded + 패널 안 English 옵션 버튼 노출
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const englishOption = page.locator('header button:has-text("English")');
      await expect(englishOption).toBeVisible();

      // ESC
      await page.keyboard.press('Escape');

      // 닫힘 확인
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(englishOption).toBeHidden();
    });
  });

  test.describe('로그인 dropdown', () => {
    test('ShoppingCart dropdown — ESC 로 닫힘', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const cartBtn = page.locator('header button[aria-label="장보기"]');
      await cartBtn.click();

      // 열림 확인 — aria-expanded + cart-quick-add testid 노출
      await expect(cartBtn).toHaveAttribute('aria-expanded', 'true');
      const cartPanel = page.locator('[data-testid="cart-quick-add"]');
      await expect(cartPanel).toBeVisible();

      await page.keyboard.press('Escape');

      // 닫힘 확인
      await expect(cartBtn).toHaveAttribute('aria-expanded', 'false');
      await expect(cartPanel).toBeHidden();
    });

    test('NotificationPanel — ESC 로 닫힘', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 종 아이콘은 desktop header 만 노출. trigger 의 aria-expanded 변화로 단언 (다른 4곳과 동일 패턴).
      const bellBtn = page.locator('header button[aria-label="알림"]').first();
      await bellBtn.click();

      await expect(bellBtn).toHaveAttribute('aria-expanded', 'true');

      await page.keyboard.press('Escape');

      await expect(bellBtn).toHaveAttribute('aria-expanded', 'false');
    });

    test('UserDropdown — ESC 로 닫힘', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 사용자 아바타 버튼 (PC header)
      const avatarBtn = page.locator('header button[aria-label="프로필 메뉴"]').first();
      await avatarBtn.click();

      await expect(avatarBtn).toHaveAttribute('aria-expanded', 'true');

      await page.keyboard.press('Escape');

      await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
