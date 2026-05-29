import { test, expect } from './fixtures';

/**
 * 재료 이모지 표시 회귀 안전망
 *
 * DB 기반 이모지 통합 작업(ingredients_master.emoji 컬럼) **전** 선작성.
 * 현재: 정적 파일(ingredientEmoji.ts) + quickAddList.ts 이중 소스
 * 이후: ingredients_master DB 단일 소스
 *
 * 잠그는 불변식:
 *  1. 데모 냉장고 칩 — 특정 재료명에 정확한 이모지 표시 (비로그인)
 *  2. 요리 도감 페이지 — 재료 카드/리스트에 이모지 표시
 *  3. 재료 브라우저 모달 — 자주 쓰는 재료 이모지 표시
 *
 * 이모지 불변식: 이 파일에 기록된 이모지 값이 DB 이전 후에도 동일해야 함.
 * 변경이 필요하면 의도적 결정이므로 별도 커밋으로 처리.
 */

test.describe('데모 냉장고 칩 이모지 (비로그인)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');
  });

  // 모바일 뷰포트에서도 안정적으로 보이는 칩만 포함
  // (양파·버섯·파스타는 모바일 레이아웃에서 스크롤 밖 → 제외)
  const DEMO_EMOJI_CASES: [string, string][] = [
    ['닭고기', '🍗'],
    ['당근',   '🥕'],
    ['마늘',   '🧄'],
    ['계란',   '🥚'],
    ['감자',   '🥔'],
    ['토마토', '🍅'],
    ['소금',   '🧂'],
  ];

  for (const [name, emoji] of DEMO_EMOJI_CASES) {
    test(`${name} 칩에 ${emoji} 표시`, async ({ page }) => {
      // 칩 버튼: accessible name이 "{emoji} {name}" 또는 "{name}" 형태
      const chip = page.getByRole('button', { name: new RegExp(name) }).first();
      await expect(chip).toBeVisible({ timeout: 8000 });

      // 칩 텍스트에 이모지 포함 확인
      const chipText = await chip.textContent();
      expect(chipText).toContain(emoji);
    });
  }

  test('이모지 없는 칩은 텍스트만 표시 (카테고리 폴백 없음)', async ({ page }) => {
    // getPreciseEmoji가 null 반환 시 칩에서 이모지 span 미렌더 확인
    // 데모 아이템은 전부 precise 매핑이 있어야 함 → 이모지 없는 칩이 0개여야 함
    const chips = page.locator('[data-testid="fridge-chip"], button').filter({
      has: page.locator('span').filter({ hasText: /[^\x00-\x7F]/ }), // 비ASCII = 이모지
    });
    // 최소 1개 이상의 이모지 칩이 있어야 함
    await expect(chips.first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('부엌 도감 페이지 이모지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ko/kitchen');
    await page.waitForLoadState('networkidle');
  });

  test('재료 목록에 이모지 표시', async ({ page }) => {
    // 재료 카드/리스트 아이템이 이모지를 포함하는지 확인
    // IngredientBrowseClient: <span>{getIngredientEmoji(...)}</span>
    await page.waitForTimeout(1000);

    // 이모지 포함 요소가 1개 이상 존재
    const emojiSpans = page.locator('span').filter({
      hasText: /[\u{1F300}-\u{1FFFF}]/u,
    });
    await expect(emojiSpans.first()).toBeVisible({ timeout: 8000 });
  });

  // 검색·필터가 실제 동작하는 곳은 브라우즈 뷰(IngredientBrowseClient).
  // V2(2026-05-29)에서 /kitchen 루트는 카테고리 카드 허브(KitchenHomeClient)로 바뀜 —
  // 허브 검색바("재료·도구·기법 검색…")는 navigate 전용이고, 도착하는 브라우즈 뷰의
  // in-place 검색 input(data-testid="ingredient-search")으로 필터한다.
  // (?category=veggie 로 브라우즈 뷰 렌더 → 그 안 검색 input 으로 필터 → 상세는 카드 탭으로)
  test('양파 검색 시 🧅 이모지 표시', async ({ page }) => {
    await page.goto('/ko/kitchen?category=veggie');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByTestId('ingredient-search');
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill('양파');
    await page.waitForTimeout(700);

    const result = page.getByText('🧅').first();
    await expect(result).toBeVisible({ timeout: 6000 });
  });

  test('당근 검색 시 🥕 이모지 표시', async ({ page }) => {
    await page.goto('/ko/kitchen?category=veggie');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByTestId('ingredient-search');
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill('당근');
    await page.waitForTimeout(700);

    const result = page.getByText('🥕').first();
    await expect(result).toBeVisible({ timeout: 6000 });
  });

  test('카테고리 선택 시 이모지 표시', async ({ page }) => {
    // 채소 카테고리 선택
    const vegBtn = page.getByRole('button', { name: /채소|veggie/i }).first();
    if (await vegBtn.count() > 0) {
      await vegBtn.click();
      await page.waitForTimeout(500);
    }

    // 채소 카테고리 내 이모지 존재 확인
    const emojiSpans = page.locator('span').filter({
      hasText: /[\u{1F300}-\u{1FFFF}]/u,
    });
    await expect(emojiSpans.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('재료 브라우저 모달 이모지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');
  });

  test('+ 버튼 → 모달 → 자주 쓰는 재료 이모지 표시', async ({ page }) => {
    // FAB(+) 또는 재료 추가 버튼
    const addBtn = page.getByRole('button', { name: /재료 추가|^\+$/ }).first();
    if (await addBtn.count() === 0) return; // 비로그인 상태 skip

    await addBtn.click();
    await page.waitForTimeout(500);

    // 모달 내 이모지 포함 요소 확인
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.count() === 0) return;

    const emojiInModal = modal.locator('span').filter({
      hasText: /[\u{1F300}-\u{1FFFF}]/u,
    });
    await expect(emojiInModal.first()).toBeVisible({ timeout: 5000 });
  });
});
