import { test, expect } from './fixtures';

/**
 * signin/page.tsx (~877줄 god-file) 분해(Phase 2 후속) 회귀 안전망 — Step 0.
 *
 * auth.spec.ts 가 로그인 메인 카드(폼·이메일검증·show-password·회원가입 링크)는
 * 강커버. 미커버 = 아이디찾기/비밀번호찾기 *모달*(open/close/ESC/렌더) —
 * 정확히 분해 추출 타겟. 이 갭만 보강(중복 금지). 미분해 코드 baseline green.
 *
 * 비동기 흐름(find-email API·reset 이메일 발송)은 외부 이메일 인프라 의존이라
 * 분해 위험과 무관 → 모달 wiring(개폐·ESC·콘텐츠 렌더)만 가드.
 */
test.describe('로그인 모달 — god-file 분해 회귀 안전망', () => {
  test('아이디 찾기 모달: 열기 → 콘텐츠 렌더 → X 닫기 → ESC 닫기', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form button[type="submit"]')).toBeVisible();

    const openBtn = page.getByRole('button', { name: '아이디 찾기', exact: true });
    await openBtn.click();

    // 모달 콘텐츠 (모달 한정 라벨 — 메인 카드엔 없음)
    await expect(page.getByText('사용자명 (@ 없이 입력)')).toBeVisible();
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await expect(modal.locator('input[autocomplete="username"]')).toBeVisible();

    // 헤더 X (모달 첫 버튼) 로 닫기
    await modal.getByRole('button').first().click();
    await expect(page.getByText('사용자명 (@ 없이 입력)')).toHaveCount(0);

    // 재오픈 → ESC 닫기
    await openBtn.click();
    await expect(page.getByText('사용자명 (@ 없이 입력)')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('사용자명 (@ 없이 입력)')).toHaveCount(0);
  });

  test('비밀번호 찾기 모달: 열기 → step1 렌더 → X 닫기 → ESC 닫기', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form button[type="submit"]')).toBeVisible();

    const openBtn = page.getByRole('button', { name: '비밀번호 찾기', exact: true });
    await openBtn.click();

    // step1 안내 문구(모달 한정)
    await expect(page.getByText('비밀번호를 재설정할 이메일을 입력하세요')).toBeVisible();
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal.locator('input[type="email"]')).toBeVisible();

    await modal.getByRole('button').first().click();
    await expect(page.getByText('비밀번호를 재설정할 이메일을 입력하세요')).toHaveCount(0);

    await openBtn.click();
    await expect(page.getByText('비밀번호를 재설정할 이메일을 입력하세요')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('비밀번호를 재설정할 이메일을 입력하세요')).toHaveCount(0);
  });
});
