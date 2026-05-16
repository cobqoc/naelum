import { test, expect } from './auth-fixtures';

/**
 * FloatingFeedbackButton 회귀 — orphan(어디에도 미마운트) 이던 컴포넌트를
 * app/[lang]/layout.tsx 에 연결. 잠그는 불변식:
 *  1. 노출 페이지(/tip 등)에 버튼 보임 + 클릭 시 ContactModal 열림
 *  2. 자체 hide 로직(useLocalizedPathname 기반): 홈(/) · /login 에서 숨김
 *     (i18n 경로 /ko 에서도 정상 — bare-path 비교 버그 fix 회귀 가드)
 *
 * 인증 불필요(누구나 의견 전송). 기본 ko locale (/ → /ko redirect).
 * 셀렉터 = aria-label "의견 보내기"(t.contact.feedbackAria, ko).
 */
test.describe('FloatingFeedbackButton (layout 연결 회귀)', () => {
  const fbBtn = 'button[aria-label="의견 보내기"]';

  test('노출 페이지(/tip)에 보이고 클릭 시 ContactModal 열림', async ({ page }) => {
    await page.goto('/tip');
    await page.waitForLoadState('networkidle');

    const btn = page.locator(fbBtn);
    await expect(btn).toBeVisible();
    await btn.click();
    // ContactModal — t.contact.title (ko: "✉️ 개발자에게 문의")
    await expect(page.getByText('개발자에게 문의')).toBeVisible();
  });

  test('홈(/)·/login 에서는 자체 hide 로직으로 숨김 (i18n /ko 경로 회귀 가드)', async ({ page }) => {
    // 홈 — useLocalizedPathname() === '/' → hide. /ko redirect 후에도 정상이어야.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toMatch(/^\/[a-z]{2}$/); // /ko 등
    await expect(page.locator(fbBtn)).toHaveCount(0);

    // /login — startsWith('/login') → hide
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(fbBtn)).toHaveCount(0);

    // /delivery — 배달은 앱 chrome 격리 플로우. 고정 버튼이 결제 UI 클릭을
    // 가로채는 회귀 가드(CLAUDE.md: 배달 Header/BottomNav 미노출).
    await page.goto('/delivery');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(fbBtn)).toHaveCount(0);
  });
});
