import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 냉장고 칩 상호작용 회귀 안전망 — `useFridgeInteractions` hook 추출 **전** 선보강.
 * (ARCHITECTURE god-file 분해계획 Step 0: 상태+timer+ref 이동은 고위험 →
 *  최고가치 불변식을 먼저 e2e 로 잠근다. OnboardingBanner 선안전망 전략 동일.)
 *
 * 잠그는 불변식:
 *  1. long-press(터치 500ms) → 삭제 토스트 + undo → dbTimer 취소 → **DB 잔존** + UI 복원
 *  2. 액션 시트 삭제 → undo 안 함 → window(5500ms) 경과 → **DB 삭제** (타이머 시맨틱)
 *  3. 동일 이름 그룹 chip → 미니 시트 → 개별 선택 → 해당 항목 액션 시트
 *
 * 기존 logged-in-home:449 는 단일칩→액션시트→수정모달만 커버. 위 3개는 미커버.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isoDateOffsetDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DELETE_UNDO_WINDOW_MS = 5500; // app/[lang]/_home/constants.ts 와 동일해야 함
const LONG_PRESS_MS = 500;

test.describe('냉장고 칩 상호작용 (hook 분해 안전망)', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('long-press 삭제 → undo → dbTimer 취소(DB 잔존) + UI 복원', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 667 });
    const name = 'e2e롱프레스양파';
    const { data: inserted } = await admin()
      .from('user_ingredients')
      .insert({
        user_id: testUser.userId, ingredient_name: name, category: 'veggie',
        expiry_date: isoDateOffsetDays(10), storage_location: '냉장',
      })
      .select('id')
      .single();
    const rowId = inserted!.id as string;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 단일 재료 → groupCount===1 → chip 의 onTouchStart 가 long-press 타이머 시작.
    // (chip 이 X 버튼과 accessible name 일부 공유 → DOM 선두 .first() = chip, 449 컨벤션)
    const chip = page.getByRole('button', { name: new RegExp(name) }).first();
    await expect(chip).toBeVisible({ timeout: 10000 });

    // 합성 touchstart 디스패치 → React onTouchStart → handleChipPressStart →
    // LONG_PRESS_MS 후 handleDeleteFromSheet (touchend 미발생 = 타이머 그대로 발화).
    await chip.dispatchEvent('touchstart');
    await page.waitForTimeout(LONG_PRESS_MS + 400);

    // 삭제 토스트 + chip UI 제거
    await expect(page.getByText(`🗑 ${name} 삭제됨`)).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(name) })).toHaveCount(0);

    // undo 창 내 [실행 취소] → 복원
    await page.getByRole('button', { name: '실행 취소' }).click();
    await expect(page.getByRole('button', { name: new RegExp(name) }).first()).toBeVisible();

    // window 경과해도 DB 잔존 (undo 가 dbTimer 를 clearTimeout 했는지)
    await page.waitForTimeout(DELETE_UNDO_WINDOW_MS + 1000);
    const { data: still } = await admin()
      .from('user_ingredients').select('id').eq('id', rowId);
    expect(still).toHaveLength(1);
  });

  test('액션 시트 삭제 → undo 안 함 → window 경과 → DB 삭제', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    const name = 'e2e삭제확정마늘';
    const { data: inserted } = await admin()
      .from('user_ingredients')
      .insert({
        user_id: testUser.userId, ingredient_name: name, category: 'veggie',
        expiry_date: isoDateOffsetDays(10), storage_location: '냉장',
      })
      .select('id')
      .single();
    const rowId = inserted!.id as string;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const chip = page.getByRole('button', { name: new RegExp(name) }).first();
    await expect(chip).toBeVisible({ timeout: 10000 });
    await chip.click({ force: true });

    // 액션 시트 → 삭제하기
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    await sheet.getByText('삭제하기').click();
    await expect(page.getByText(`🗑 ${name} 삭제됨`)).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(name) })).toHaveCount(0);

    // undo 클릭 안 함 → window(5500ms) + 비동기 DB delete roundtrip 후 삭제 확정.
    // 병렬 부하 시 roundtrip 지연 가능 → 고정 wait 대신 poll(불변식 자체는 동일,
    // "row 삭제됨"을 비결정 타이밍에 견고하게 단언. 증상 은폐 아님).
    await expect.poll(async () => {
      const { data } = await admin().from('user_ingredients').select('id').eq('id', rowId);
      return data?.length ?? -1;
    }, { timeout: DELETE_UNDO_WINDOW_MS + 12000 }).toBe(0);
  });

  test('동일 이름 그룹 chip → 미니 시트 → 개별 선택 → 액션 시트', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    const name = 'e2e그룹두부';
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: name, category: 'other', expiry_date: isoDateOffsetDays(3), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: name, category: 'other', expiry_date: isoDateOffsetDays(20), storage_location: '냉장' },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 그룹(2개) → 단일 chip + ×2 배지. groupCount>1 → 클릭 시 미니 시트.
    const groupChip = page.getByRole('button', { name: new RegExp(`${name}.*×\\s*2|${name}`) }).first();
    await expect(groupChip).toBeVisible({ timeout: 10000 });
    await groupChip.click({ force: true });

    // 미니 시트 식별 = "×2" 텍스트(그룹 카운트 배지, 미니 시트 헤딩에만 존재).
    // ⚠️ [role=dialog][aria-modal] 은 IngredientActionSheet 와 공유 → 모호.
    // 따라서 미니 시트 열림/닫힘은 "×2" 유무로, 항목 선택 라우팅은 액션 시트
    // 텍스트 노출로 단언(클릭 시 setGroupSheet(null)+setActionItem 동시 발생).
    const miniSheet = page.locator('[role="dialog"][aria-modal="true"]', { has: page.getByText('×2') });
    await expect(miniSheet).toBeVisible();
    await expect(miniSheet.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
    const itemRows = miniSheet.locator('button').filter({ hasText: /·|개|g|ml|수량/ });
    // 그룹 항목 버튼은 최소 2개 (수량/구매일/만료 인라인 표시)
    expect(await itemRows.count()).toBeGreaterThanOrEqual(2);

    // 첫 항목 선택 → 해당 항목 액션 시트 오픈 + 미니 시트 닫힘.
    // ⚠️ "×2" 는 미니 시트 헤딩 + 그룹 chip 배지 양쪽에 렌더 → bare 텍스트는
    // chip 을 잡음. miniSheet(=aria-modal dialog 中 ×2 포함) 는 chip 미포함이라
    // 닫힘 단언에 정확(액션 시트엔 ×2 없음 → 0).
    await itemRows.first().click();
    await expect(page.getByText('이 재료로 만들기')).toBeVisible();
    await expect(page.getByText('수정하기')).toBeVisible();
    await expect(page.getByText('삭제하기')).toBeVisible();
    await expect(miniSheet).toHaveCount(0);
  });
});
