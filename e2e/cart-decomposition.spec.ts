import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * ShoppingCartDropdown god-file 분해(Phase 2) 회귀 안전망 — Step 0.
 *
 * 기존 cart.spec(13)·cart-note(5)·cart-share(3)·recipe-cart-toggle(4) 이
 * 추출 위험면(메모 race·스테퍼·단위·체크·삭제·quick-add·clear·hide·owned·
 * 비로그인 뷰 콘텐츠·mobile/PC open)을 이미 강하게 커버. 유일한 갭 = Header
 * 의 그룹모드 토글(recipe↔category, totalCount>=2 에서만 노출 + localStorage
 * 영속) 이 어느 spec 에서도 직접 단언 안 됨. CartHeader 추출이 이 토글 wiring 을
 * 깨면 잡아낼 가드. 미분해 코드에서 먼저 green 이어야 한다.
 */
test.describe('cart 분해 — 그룹모드 토글 (Step 0 안전망)', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('항목 2개 → 레시피별/카테고리별 토글이 그룹 헤더를 재구성 + localStorage 영속', async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('header button[aria-label="장보기"]').click();

    const input = page.getByPlaceholder('재료 검색 또는 직접 입력...');
    await input.fill('분해토글A');
    await input.press('Enter');
    await expect(page.locator('[data-testid="cart-list"]').getByText('분해토글A')).toBeVisible({
      timeout: 5000,
    });
    await input.fill('분해토글B');
    await input.press('Enter');
    await expect(page.locator('[data-testid="cart-list"]').getByText('분해토글B')).toBeVisible({
      timeout: 5000,
    });

    const list = page.locator('[data-testid="cart-list"]');
    const recipeBtn = page.getByRole('button', { name: '레시피별', exact: true });
    const categoryBtn = page.getByRole('button', { name: '카테고리별', exact: true });

    // 2개 이상이라 토글 노출
    await expect(recipeBtn).toBeVisible();
    await expect(categoryBtn).toBeVisible();

    // 레시피별 → 수동추가 그룹 헤더 "직접 추가" 노출 (recipe_id 없는 항목 묶음)
    await recipeBtn.click();
    await expect(list.getByText('직접 추가', { exact: true })).toBeVisible();

    // 카테고리별 → "직접 추가" 그룹 헤더 사라지고 카테고리(기타) 헤더로 재구성
    await categoryBtn.click();
    await expect(list.getByText('직접 추가', { exact: true })).toHaveCount(0);
    await expect(list.getByText('기타', { exact: true })).toBeVisible();

    // localStorage 영속 (switchGroupMode 부수효과)
    expect(await page.evaluate(() => localStorage.getItem('cart_group_mode'))).toBe('category');
    await recipeBtn.click();
    expect(await page.evaluate(() => localStorage.getItem('cart_group_mode'))).toBe('recipe');
  });
});
