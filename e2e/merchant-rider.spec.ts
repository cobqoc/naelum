import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 식당 사장님·라이더 페이지 스모크.
// 진입은 admin 페이지에서만. 직접 URL은 auth만 거치면 접근 가능.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('식당 사장님 어드민', () => {
  test.beforeEach(async ({ testUser }) => {
    // 테스트 유저의 식당·라이더 데이터 정리
    await admin().from('delivery_orders').delete().eq('user_id', testUser.userId);
    await admin().from('delivery_restaurants').delete().eq('owner_id', testUser.userId);
    await admin().from('delivery_rider_profiles').delete().eq('user_id', testUser.userId);
  });

  test('비로그인 사용자 /merchant 접근 시 signin redirect', async ({ page }) => {
    await page.goto('/ko/merchant');
    await expect(page).toHaveURL(/signin/, { timeout: 10_000 });
  });

  test('식당 없는 사용자 /merchant → /merchant/onboarding redirect', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ko/merchant');
    await expect(authenticatedPage).toHaveURL(/\/merchant\/onboarding/, { timeout: 10_000 });
    await expect(authenticatedPage.getByRole('heading', { name: '식당 등록' })).toBeVisible();
  });

  test('식당 등록 → 대시보드 진입', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/ko/merchant/onboarding');

    await page.getByTestId('form-name').fill('테스트 식당');
    await page.getByTestId('form-cuisine').fill('한식, 분식');
    await page.getByTestId('form-delivery-fee').fill('2500');
    await page.getByTestId('form-min-order').fill('10000');
    await page.getByTestId('onboarding-submit').click();

    await expect(page).toHaveURL(/\/merchant$/, { timeout: 10_000 });
    await expect(page.getByText('테스트 식당')).toBeVisible();
    await expect(page.getByTestId('stat-orders')).toBeVisible();
  });

  test('등록된 식당의 메뉴 관리', async ({ authenticatedPage, testUser }) => {
    // 사전 데이터: 식당 직접 INSERT
    await admin().from('delivery_restaurants').insert({
      owner_id: testUser.userId,
      name: 'E2E 메뉴 테스트',
      cuisine_types: ['한식'],
      delivery_fee: 3000,
      min_order_price: 12000,
      avg_cook_time_min: 25,
      is_active: true,
      is_open: false,
    });

    const page = authenticatedPage;
    await page.goto('/ko/merchant/menu');

    // 카테고리 추가
    await page.getByTestId('new-category-name').fill('대표 메뉴');
    await page.getByTestId('add-category').click();
    await expect(page.getByText('대표 메뉴').first()).toBeVisible({ timeout: 5000 });

    // 메뉴 항목 추가
    const categoryBlocks = page.locator('[data-testid^="category-"]');
    await expect(categoryBlocks).toHaveCount(1);
    const catEl = categoryBlocks.first();
    const catId = await catEl.getAttribute('data-testid');
    const catUuid = catId!.replace('category-', '');

    await page.getByTestId(`add-item-${catUuid}`).click();
    await page.getByTestId(`new-item-name-${catUuid}`).fill('테스트김밥');
    await page.getByTestId(`new-item-price-${catUuid}`).fill('5000');
    await page.getByTestId(`save-item-${catUuid}`).click();

    await expect(page.getByText('테스트김밥').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('라이더 페이지', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('delivery_rider_profiles').delete().eq('user_id', testUser.userId);
  });

  test('비로그인 사용자 /rider 접근 시 signin redirect', async ({ page }) => {
    await page.goto('/ko/rider');
    await expect(page).toHaveURL(/signin/, { timeout: 10_000 });
  });

  test('라이더 프로필 없는 사용자 → setup 화면', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ko/rider');
    await expect(authenticatedPage.getByRole('heading', { name: '라이더 등록' })).toBeVisible();
    await expect(authenticatedPage.getByTestId('vehicle-motorcycle')).toBeVisible();
  });

  test('라이더 setup → 온라인 토글', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/ko/rider');
    await page.getByTestId('vehicle-motorcycle').click();

    // setup 완료 → 메인 화면
    await expect(page.getByTestId('rider-toggle')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('no-dispatches')).toBeVisible();

    // 온라인 전환
    await page.getByTestId('rider-toggle').click();
    await expect(page.getByTestId('rider-toggle')).toContainText('온라인');
  });
});

test.describe('admin 페이지에서 진입 링크', () => {
  test('비로그인 사용자 /admin/dispatch 접근 시 signin redirect', async ({ page }) => {
    await page.goto('/ko/admin/dispatch');
    await expect(page).toHaveURL(/(signin|admin)/);
  });
});
