import { test, expect } from './auth-fixtures';

/**
 * Header dropdown 화살표 키 list navigation (Phase C — a11y).
 *
 * 동작:
 *  - 패널 열린 상태에서 ↓ 키 → 다음 항목으로 focus
 *  - ↑ 키 → 이전 항목으로 focus (첫에서 ↑ → 마지막으로 wrap)
 *  - Home → 첫 항목
 *  - End → 마지막 항목
 *
 * 대표 1 케이스 (More menu) — LangSelector·UserDropdown 동일 hook 패턴.
 */
test.describe('Header dropdown — list keyboard navigation', () => {
  test('More menu — ↓↑/Home/End 화살표 키로 항목 이동', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const trigger = page.locator('header button[aria-label="더보기"]');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // panel 의 list items 인덱스 매핑 — focusable a/button
    const getActiveIndex = () => page.evaluate(() => {
      const panel = document.querySelector('header div.w-52');
      if (!panel) return -1;
      const items = Array.from(panel.querySelectorAll('a, button'));
      return items.indexOf(document.activeElement as Element);
    });

    // ↓ → 첫 항목으로
    await page.keyboard.press('ArrowDown');
    expect(await getActiveIndex()).toBe(0);

    // ↓ → 두번째
    await page.keyboard.press('ArrowDown');
    expect(await getActiveIndex()).toBe(1);

    // ↑ → 첫번째로 복귀
    await page.keyboard.press('ArrowUp');
    expect(await getActiveIndex()).toBe(0);

    // ↑ wrap → 마지막
    await page.keyboard.press('ArrowUp');
    const lastIdx = await page.evaluate(() => {
      const panel = document.querySelector('header div.w-52');
      return panel ? panel.querySelectorAll('a, button').length - 1 : -1;
    });
    expect(await getActiveIndex()).toBe(lastIdx);

    // Home → 첫번째
    await page.keyboard.press('Home');
    expect(await getActiveIndex()).toBe(0);

    // End → 마지막
    await page.keyboard.press('End');
    expect(await getActiveIndex()).toBe(lastIdx);
  });
});
