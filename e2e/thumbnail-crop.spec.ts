import type { Page } from '@playwright/test';
import { test, expect } from './auth-fixtures';

/**
 * 썸네일 자르기(crop) 모달 회귀 안전망.
 *
 * 진짜 문제 = 파일 선택 시 *어떤 사진이든* 사용자가 자기 사진의 어떤 부분이
 * 보일지 통제 못 했던 것 ([[project-thumbnail-crop-next-session]] 옵션 3).
 * 이제 모든 파일이 16:9 crop 모달을 거치고, 사용자가 영역을 잡아야만 업로드.
 *
 * 4 개 진입점 — recipes/new · recipes/[id]/edit · tip/new · tip/[id]/edit.
 * 이 스펙은 *모달 렌더·접근성·취소 흐름* 만 검증한다. confirm 흐름(canvas →
 * blob → storage 업로드)은 headless 환경에서 unreliable + storage write 가
 * 실제 트래픽이라 e2e 회귀로 안 쓴다. 실제 사용자 경로는 수동 QA(claude-in-
 * chrome 라이브) 가 가드.
 *
 * Playwright 의 `setInputFiles` 로 빈 PNG 버퍼를 input 에 주입하면 onChange
 * 가 발화해 모달이 열린다. 모달 안의 `<img>` 가 blob: URL 을 로드하면 crop
 * 영역이 그려지지만 실제 픽셀이 거의 없어 confirm 은 noop 가능 — 그래서
 * 취소 흐름만 검증.
 */

// 1x1 흰색 PNG (가장 작은 valid PNG, base64).
// crop UI 자체는 이미지 mime/dimension 만 보고 모달 열어주므로 충분.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const TINY_PNG_BUFFER = Buffer.from(TINY_PNG_BASE64, 'base64');

const FIXTURE_FILE = {
  name: 'test-thumbnail.png',
  mimeType: 'image/png',
  buffer: TINY_PNG_BUFFER,
} as const;

async function gotoRecipeNew(page: Page) {
  await page.goto('/recipes/new', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {});
  // 제목 input 이 보일 때까지 — 폼이 렌더된 신호
  await expect(page.locator('input[placeholder*="떡볶이"], input[placeholder*="만드는건"]').first()).toBeVisible({ timeout: 15000 });
}

async function gotoTipNew(page: Page) {
  await page.goto('/tip/new', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {});
  await expect(page.locator('input[placeholder*="마늘"]').first()).toBeVisible({ timeout: 15000 });
}

test.describe('썸네일 자르기 모달', () => {
  test('recipes/new — 파일 선택 시 자르기 모달 열림 + 취소 → 모달 닫힘', async ({
    authenticatedPage: page,
  }) => {
    await gotoRecipeNew(page);

    // hidden file input 에 직접 파일 주입 (label click 우회).
    // accept="image/*" 인 input 중 첫 번째 = 썸네일 input.
    const fileInput = page.getByTestId('thumbnail-file-input');
    await fileInput.setInputFiles(FIXTURE_FILE);

    // 모달 — role=dialog + aria-modal + aria-labelledby="image-crop-modal-title"
    const dialog = page.getByRole('dialog').filter({ has: page.locator('#image-crop-modal-title') });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // 헤더 — "이미지 자르기" (ko locale)
    await expect(page.locator('#image-crop-modal-title')).toContainText(/이미지 자르기|Crop image/);

    // 취소 클릭 → 모달 닫힘.
    // backdrop 도 aria-label="취소" 가 붙어 있어 (a11y 명목) name match 가 둘 다
    // 잡는다 — 텍스트 콘텐츠로 bottom 버튼만 특정.
    await dialog.locator('button', { hasText: /^취소$|^Cancel$/ }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('tip/new — 파일 선택 시 자르기 모달 열림 + ESC 취소', async ({
    authenticatedPage: page,
  }) => {
    await gotoTipNew(page);

    const fileInput = page.getByTestId('thumbnail-file-input');
    await fileInput.setInputFiles(FIXTURE_FILE);

    const dialog = page.getByRole('dialog').filter({ has: page.locator('#image-crop-modal-title') });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // ESC → 모달 닫힘 (useEscapeKey 가드)
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('recipes/new — 비-이미지 파일 거부 + 모달 안 뜸', async ({
    authenticatedPage: page,
  }) => {
    await gotoRecipeNew(page);

    const fileInput = page.getByTestId('thumbnail-file-input');
    await fileInput.setInputFiles({
      name: 'not-image.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    // accept="image/*" 가 브라우저 필터로 막거나, file.type.startsWith('image/')
    // 가드가 toast 띄우고 picker 종료. 어느 쪽이든 모달은 안 열림.
    const dialog = page.getByRole('dialog').filter({ has: page.locator('#image-crop-modal-title') });
    // 짧게 대기 — 1초 안에 모달 안 뜨면 정상 (가드 작동)
    await page.waitForTimeout(1000);
    await expect(dialog).not.toBeVisible();
  });
});
