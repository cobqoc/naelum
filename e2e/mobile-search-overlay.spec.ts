import { test, expect } from './auth-fixtures';

/**
 * HomeClient 모바일 검색 오버레이 회귀 안전망 — _home/MobileSearchOverlay 분해 전 선추가.
 * (OnboardingBanner 분해 전 안전망 커밋과 동일 전략)
 *
 * 오버레이는 opacity-토글(항상 DOM 상주)이라 Playwright isVisible()가 false-positive.
 * 유일하게 신뢰 가능한 신호는 패널의 aria-hidden={!showMobileSearch} 속성.
 * HomeClient 패널 식별자 = 닫기 버튼 aria-label "검색 닫기"(t.common.closeSearch).
 * (BottomNav 자체 검색 다이얼로그는 "닫기"=t.common.close 라 명확히 구분됨)
 */
test.describe('모바일 검색 오버레이 (HomeClient)', () => {
  // 근본 원인(useLocalizedPathname)으로 BottomNav.tsx isFridgeHome 이 i18n
  // 경로(/ko…)에서도 정상 → toggle-fridge-search 발화 → 오버레이 도달 가능.
  // _home/MobileSearchOverlay 분해 안전망 (OnboardingBanner 선안전망 전략 동일).
  test('BottomNav 검색 → 오버레이 열림 + 콘텐츠 + 닫기 버튼/배경 클릭으로 닫힘', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // HomeClient 오버레이 패널 — "검색 닫기" 버튼을 품은 aria-hidden div (backdrop은 미포함)
    const panel = page
      .locator('div[aria-hidden]')
      .filter({ has: page.locator('button[aria-label="검색 닫기"]') });

    // 초기: 닫힘
    await expect(panel).toHaveAttribute('aria-hidden', 'true');

    // BottomNav 검색 아이콘 클릭 → toggle-fridge-search → 오버레이 열림
    await page.locator('nav [aria-label="검색"]').click();
    await expect(panel).toHaveAttribute('aria-hidden', 'false');

    // 열린 상태 콘텐츠: 검색바 + 레시피/팁 빠른 이동 링크
    await expect(panel.locator('[role="search"]')).toBeVisible();
    await expect(panel.getByRole('link', { name: /레시피/ })).toBeVisible();
    await expect(panel.getByRole('link', { name: /팁/ })).toBeVisible();

    // 닫기 버튼 → 닫힘
    await page.locator('button[aria-label="검색 닫기"]').click();
    await expect(panel).toHaveAttribute('aria-hidden', 'true');

    // 다시 열고 → 배경(backdrop, z-40 aria-hidden div) 클릭으로도 닫힘
    await page.locator('nav [aria-label="검색"]').click();
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await page.locator('div[aria-hidden].z-40').click();
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
  });
});
