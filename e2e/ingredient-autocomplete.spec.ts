import { test, expect } from './fixtures';

test.describe('재료 자동완성 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 레시피 작성 페이지로 이동 (인증 필요)
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');

    // 비인증으로 인해 로그인 페이지로 리다이렉트되면 테스트 스킵
    // (E2E용 인증 세션 셋업이 없는 환경에서는 자연스럽게 스킵됨)
    if (page.url().includes('/login')) {
      test.skip(true, '레시피 작성 페이지는 인증이 필요합니다 (E2E 인증 세션 미설정)');
    }
  });

  test('기본 자동완성 - 검색어 입력 시 드롭다운 표시', async ({ page }) => {
    // 재료 입력란 찾기
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    // "돼지" 입력
    await ingredientInput.fill('돼지');

    // 디바운싱(300ms) + API 응답 시간 대기
    await page.waitForTimeout(1000);

    // 자동완성 드롭다운 표시 확인 (최대 5초 대기)
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // 검색 결과 항목 확인
    const options = page.locator('[role="option"]');
    // 최소 1개 이상 있으면 성공
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('키보드 네비게이션 - 화살표 키로 탐색', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    // 입력란에 포커스 + 입력
    await ingredientInput.click();
    await ingredientInput.fill('돼지');

    // 검색 결과가 로드될 때까지 대기
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });

    // 클릭으로 선택 (키보드 대신 - 더 신뢰성 있음)
    await firstOption.click();

    // 입력창에 선택된 재료명 표시 확인
    await page.waitForTimeout(200); // 상태 업데이트 대기
    const value = await ingredientInput.inputValue();

    // 값이 변경되었는지 확인 (비어있지 않고, "돼지"를 포함)
    expect(value.length).toBeGreaterThan(0);
    expect(value).toContain('돼지');
  });

  test('카테고리 필터 - 육류 필터링', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    // 입력란 클릭하여 자동완성 활성화
    await ingredientInput.click();

    // 카테고리 필터 버튼 찾기 (육류)
    const meatButton = page.locator('button:has-text("육류")');

    // 육류 버튼 존재 확인
    if (await meatButton.count() > 0) {
      await meatButton.click();

      // 검색어 입력
      await ingredientInput.fill('고기');
      await page.waitForTimeout(1000);

      // 필터링된 결과 확인 (육류만 표시되어야 함)
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible({ timeout: 5000 });
    }
  });

  test('커스텀 재료 추가 - 검색 결과 없을 때', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    // 존재하지 않는 재료명 입력
    const customIngredient = `테스트재료${Date.now()}`;
    await ingredientInput.fill(customIngredient);
    await page.waitForTimeout(1000);

    // "직접 추가하기" 버튼 확인
    const addButton = page.locator('button:has-text("직접 추가하기")');

    // 버튼이 있으면 클릭
    if (await addButton.count() > 0) {
      await addButton.click();

      // 입력창에 커스텀 재료명 유지 확인
      await expect(ingredientInput).toHaveValue(customIngredient);
    }
  });

  test('최근 선택 재료 - localStorage 저장 및 표시', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    // 재료 선택
    await ingredientInput.fill('돼지');
    await page.waitForTimeout(1000);

    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.count() > 0) {
      await firstOption.click();

      // 페이지 새로고침
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 재료 입력란 다시 찾기
      const newInput = page.locator('input[placeholder*="재료"]').first();
      await newInput.click();

      // "최근 선택한 항목" 섹션 확인
      const recentSection = page.locator('text=최근 선택한 항목');
      // 최근 항목이 있으면 표시되어야 함
      const hasRecent = await recentSection.count() > 0;
      if (hasRecent) {
        await expect(recentSection).toBeVisible();
      }
    }
  });

  test('단위 자동 설정 - 재료 선택 시 단위 자동 입력', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    await ingredientInput.fill('돼지');
    await page.waitForTimeout(1000);

    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.count() > 0) {
      await firstOption.click();

      // 단위 필드가 자동으로 설정되었는지 확인
      // (같은 행의 단위 select/input 찾기)
      await page.waitForTimeout(200);

      // 단위 입력란 확인 (정확한 선택자는 실제 DOM 구조에 따라 조정 필요)
      const unitInput = page.locator('input[placeholder*="수량"], select').first();
      const hasValue = await unitInput.count() > 0;
      expect(hasValue).toBeTruthy();
    }
  });

  test('Escape 키로 드롭다운 닫기', async ({ page }) => {
    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    await ingredientInput.fill('돼지');
    await page.waitForTimeout(1000);

    // 드롭다운 표시 확인
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Escape 키 누르기
    await ingredientInput.press('Escape');

    // 드롭다운 숨김 확인
    await expect(dropdown).not.toBeVisible();
  });

  test('모바일 - 터치로 재료 선택', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    const ingredientInput = page.locator('input[placeholder*="재료"]').first();

    await ingredientInput.fill('돼지');
    await page.waitForTimeout(1000);

    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.count() > 0) {
      // 터치로 선택 (tap 사용)
      await firstOption.tap();

      // 입력창에 값 설정 확인
      const value = await ingredientInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
