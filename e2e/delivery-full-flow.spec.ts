import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 풀 플로우 통합 테스트 — 한 testUser가 손님·사장님·라이더 3역할 수행.
// 같은 user_id가 user_id, owner_id, rider_id로 동시에 매칭되어도 RLS 정책 통과.
// 실 서비스에선 각 역할이 다른 사용자지만, 데이터 흐름·상태 전환을 한 번에 검증.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('배달 풀 플로우 (손님 → 사장님 → 라이더)', () => {
  test.beforeEach(async ({ page, testUser }) => {
    const a = admin();
    // 1) 본인 주문 삭제
    await a.from('delivery_orders').delete().eq('user_id', testUser.userId);
    // 2) orphan E2E 식당 정리 — testUser 삭제 시 ON DELETE SET NULL로 남는 데이터.
    //    먼저 해당 식당의 주문 삭제 (FK 충돌 방지), 그 다음 식당 삭제.
    const { data: orphans } = await a
      .from('delivery_restaurants')
      .select('id')
      .is('owner_id', null)
      .like('name', 'E2E%');
    if (orphans && orphans.length > 0) {
      const orphanIds = orphans.map((r) => r.id);
      await a.from('delivery_orders').delete().in('restaurant_id', orphanIds);
      await a.from('delivery_restaurants').delete().in('id', orphanIds);
    }
    // 3) 본인 식당·라이더 프로필·주소 정리
    await a.from('delivery_restaurants').delete().eq('owner_id', testUser.userId);
    await a.from('delivery_rider_profiles').delete().eq('user_id', testUser.userId);
    await a.from('delivery_addresses').delete().eq('user_id', testUser.userId);

    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('naelum_delivery_cart_v1');
        window.localStorage.removeItem('naelum_delivery_address_v1');
      } catch {}
    });
  });

  test('한 유저가 3역할 — 주문→조리→배달까지 상태 전환', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    const a = admin();

    // === Setup: 사장님이 식당 + 메뉴 등록 (service role로 직접 INSERT) ===
    const { data: restaurant, error: restErr } = await a
      .from('delivery_restaurants')
      .insert({
        owner_id: testUser.userId,
        name: 'E2E 풀플로우 식당',
        cuisine_types: ['한식'],
        delivery_fee: 3000,
        min_order_price: 10000,
        avg_cook_time_min: 25,
        is_active: true,
        is_open: true,
      })
      .select('id')
      .single();
    expect(restErr).toBeNull();

    const { data: category } = await a
      .from('delivery_menu_categories')
      .insert({ restaurant_id: restaurant!.id, name: '대표 메뉴', sort_order: 0 })
      .select('id')
      .single();

    const { data: menuItem } = await a
      .from('delivery_menu_items')
      .insert({
        restaurant_id: restaurant!.id,
        category_id: category!.id,
        name: 'E2E 풀플로우 메뉴',
        price: 15000,
        is_available: true,
        is_popular: true,
        sort_order: 0,
      })
      .select('id')
      .single();

    // === Step 1: 손님으로 주문 ===
    // 식당 ID로 직접 이동 — 리스트 페이지의 이름 매칭은 parallel 환경에서 flaky
    await page.goto(`/ko/delivery/restaurants/${restaurant!.id}`);
    await expect(page.getByTestId('restaurant-name')).toContainText('E2E 풀플로우 식당');
    await page.getByTestId(`add-to-cart-${menuItem!.id}`).click();
    await expect(page.getByTestId('cart-toast')).toBeVisible();

    await page.getByTestId('fab-cart').click();
    await expect(page).toHaveURL(/\/delivery\/cart/);
    await page.getByTestId('goto-checkout').click();

    await page.getByTestId('recipient-name').fill('테스트수령자');
    await page.getByTestId('recipient-phone').fill('010-1234-5678');
    await page.getByTestId('road-address').fill('서울 강남구 테헤란로 100');
    await page.getByTestId('address-detail').fill('1호');
    await page.getByTestId('place-order').click();

    // 주문 상세 페이지 도착 → 결제 완료 상태
    await expect(page).toHaveURL(/\/delivery\/orders\/[^/]+$/, { timeout: 15_000 });
    await expect(page.getByTestId('current-status')).toContainText('결제 완료');

    // === Step 2: 사장님으로 주문 처리 ===
    await page.goto('/ko/merchant/orders');

    // paid → accepted
    const acceptBtn = page.locator('button[data-testid^="accept-"]').first();
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
    await acceptBtn.click();

    // accepted → preparing
    const startBtn = page.locator('button[data-testid^="start-"]').first();
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await startBtn.click();

    // preparing → ready
    const readyBtn = page.locator('button[data-testid^="ready-"]').first();
    await expect(readyBtn).toBeVisible({ timeout: 10_000 });
    await readyBtn.click();

    // ready 버킷에 카드 표시 확인
    await expect(page.getByTestId('bucket-ready')).toContainText('E2E 풀플로우');

    // === Step 3: 라이더로 배달 ===
    await page.goto('/ko/rider');

    // 차량 선택 → 라이더 프로필 신규 생성
    await page.getByTestId('vehicle-motorcycle').click();
    await expect(page.getByTestId('rider-toggle')).toBeVisible({ timeout: 5_000 });

    // 오프라인 → 온라인 토글
    await page.getByTestId('rider-toggle').click();
    await expect(page.getByTestId('rider-toggle')).toContainText('온라인', { timeout: 5_000 });

    // 배차 대기 주문이 available 리스트에 나타남
    const acceptDispatch = page.locator('button[data-testid^="accept-dispatch-"]').first();
    await expect(acceptDispatch).toBeVisible({ timeout: 15_000 });
    await acceptDispatch.click();

    // 진행 중인 배달로 이동 → 픽업 버튼 표시
    await expect(page.getByTestId('current-order')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('pickup-button')).toBeVisible();
    await page.getByTestId('pickup-button').click();

    // 픽업 → 배달 완료 버튼으로 전환
    await expect(page.getByTestId('complete-button')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('complete-button').click();

    // === Step 4: 손님 측에서 최종 배달 완료 확인 ===
    await page.goto('/ko/delivery/orders');
    await expect(page.getByTestId('orders-list')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid^="order-item-"]').first()).toContainText('배달 완료');
  });
});
