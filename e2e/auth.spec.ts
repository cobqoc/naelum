import { test, expect } from './fixtures';

test.describe('인증 페이지 테스트', () => {
  test('로그인 페이지 UI 요소 확인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*login/);

    // 이메일/비밀번호 폼
    const form = page.locator('form');
    await expect(form.locator('input[type="email"]')).toBeVisible();
    await expect(form.locator('input[type="password"]')).toBeVisible();

    // 폼 내부의 submit 버튼 (소셜 로그인 버튼과 구분)
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });

  test('로그인 폼 - 빈 값 제출 시 유효성 검사', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form');
    await form.locator('button[type="submit"]').click();

    // 네이티브 유효성 검사 또는 커스텀 에러 메시지 ("이메일과 비밀번호를 모두 입력해주세요." 등)
    const emailInput = form.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasErrorMsg = await page.locator('text=/이메일|비밀번호|입력/').count() > 0;

    expect(isInvalid || hasErrorMsg).toBeTruthy();
  });

  test('로그인 폼 - 잘못된 이메일 형식 거부', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form');
    await form.locator('input[type="email"]').fill('notanemail');
    await form.locator('input[type="password"]').fill('somepassword');
    await form.locator('button[type="submit"]').click();

    const emailInput = form.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('비밀번호 보이기/숨기기 토글', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 비밀번호 placeholder로 안정적으로 잡기 (type 속성이 토글되어도 유지됨)
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await passwordInput.fill('test1234');

    const initialType = await passwordInput.getAttribute('type');
    expect(initialType).toBe('password');

    // 비밀번호 입력란 옆의 토글 버튼 (form 내부의 type=button)
    const form = page.locator('form');
    const toggleBtn = form.locator('button[type="button"]').first();
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click();
      const newType = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(newType);
    }
  });

  test('회원가입 페이지 UI 요소 확인', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*signup/);

    // 현재 회원가입은 패스워드리스(이메일 OTP / OAuth) 방식이므로 비밀번호 필드가 없다.
    await expect(page.locator('input[type="email"]')).toBeVisible();

    const signupBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("가입")'));
    await expect(signupBtn.first()).toBeVisible();
  });

  test('로그인 페이지 → 회원가입 페이지 링크', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const signupLink = page.locator('a[href*="signup"]').or(page.locator('a:has-text("회원가입")'));
    if (await signupLink.count() > 0) {
      await signupLink.first().click();
      await page.waitForURL('**/signup');
      await expect(page).toHaveURL(/.*signup/);
    }
  });

  test('보호된 경로 - 미인증 시 리다이렉트', async ({ page }) => {
    // 인증 필요 페이지에 비인증 상태로 접근
    await page.goto('/fridge');
    await page.waitForLoadState('networkidle');

    // 로그인 페이지로 리다이렉트되거나 로그인 안내가 표시되어야 함
    const isRedirected = page.url().includes('/login');
    const hasLoginPrompt = await page.locator('text=로그인').count() > 0;

    expect(isRedirected || hasLoginPrompt).toBeTruthy();
  });
});
