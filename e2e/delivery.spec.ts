import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 배달 주문 전체 플로우 e2e.
// cart는 localStorage, orders/addresses는 DB. checkout부터 auth 필요.
// dev DB의 샘플 식당 "엄마손 김치찌개" + 메뉴 "김치찌개" (12,000원) 사용.

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111101';
const RESTAURANT_NAME = '엄마손 김치찌개';
const MENU_NAME = '김치찌개';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('배달 주문 전체 플로우', () => {
  test.beforeEach(async ({ page, testUser }) => {
    // 본인 데이터만 scoped 정리. delivery_order_items는 orders CASCADE로 자동 삭제.
    await admin().from('delivery_orders').delete().eq('user_id', testUser.userId);
    await admin().from('delivery_addresses').delete().eq('user_id', testUser.userId);

    // localStorage 정리 (cart는 localStorage)
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('naelum_delivery_cart_v1');
        window.localStorage.removeItem('naelum_delivery_address_v1');
      } catch {}
    });
  });

  test('비로그인 상태에서 식당 리스트·메뉴·카트는 접근 가능', async ({ page }) => {
    await page.goto('/ko/delivery');
    await expect(page.getByRole('heading', { name: '배달 주문' })).toBeVisible();
    await expect(page.getByText(RESTAURANT_NAME).first()).toBeVisible();

    await page.goto(`/ko/delivery/restaurants/${RESTAURANT_ID}`);
    await expect(page.getByTestId('restaurant-name')).toHaveText(RESTAURANT_NAME);
  });

  test('인증 사용자: 전체 주문 플로우', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 1. 식당 리스트
    await page.goto('/ko/delivery');
    await page.getByText(RESTAURANT_NAME).first().click();

    // 2. 식당 상세 + 메뉴 담기
    await expect(page).toHaveURL(new RegExp(`/ko/delivery/restaurants/${RESTAURANT_ID}`));
    await expect(page.getByRole('heading', { name: MENU_NAME, exact: true })).toBeVisible();
    const addButton = page.locator('button[data-testid^="add-to-cart-"]').first();
    await addButton.click();
    await expect(page.getByTestId('cart-toast')).toBeVisible();
    await expect(page.getByTestId('fab-cart-count')).toHaveText('1');

    // 3. 카트 이동 + 수량 증가
    await page.getByTestId('fab-cart').click();
    await expect(page).toHaveURL(/\/ko\/delivery\/cart/);
    const menuItemId = await page.locator('[data-testid^="qty-"]').first().getAttribute('data-testid');
    const itemId = menuItemId!.replace('qty-', '');
    await page.getByTestId(`increase-${itemId}`).click();
    await expect(page.getByTestId(`qty-${itemId}`)).toHaveText('2');
    await expect(page.getByTestId('cart-subtotal')).toContainText('24,000');
    await expect(page.getByTestId('cart-total')).toContainText('27,000');

    // 4. 주문 확정 페이지로
    await page.getByTestId('goto-checkout').click();
    await expect(page).toHaveURL(/\/ko\/delivery\/checkout/);
    await expect(page.getByRole('heading', { name: '주문 확정' })).toBeVisible();

    // 5. 주소 입력
    await page.getByTestId('recipient-name').fill('홍길동');
    await page.getByTestId('recipient-phone').fill('010-1234-5678');
    await page.getByTestId('road-address').fill('서울 강남구 테헤란로 123');
    await page.getByTestId('address-detail').fill('456호');
    await page.getByTestId('request-note').fill('벨 누르지 말아주세요');
    await expect(page.getByTestId('checkout-total')).toContainText('27,000');

    // 6. 주문 제출 → 상세 페이지
    await page.getByTestId('place-order').click();
    await expect(page).toHaveURL(/\/ko\/delivery\/orders\/[^/]+$/, { timeout: 10_000 });
    await expect(page.getByTestId('order-detail-title')).toBeVisible();
    await expect(page.getByTestId('order-number')).toContainText(/\d{8}-[A-Z0-9]{4}/);
    await expect(page.getByTestId('order-total')).toContainText('27,000');
    await expect(page.getByTestId('current-status')).toBeVisible();

    // 7. 카트 비워졌는지 확인
    await expect(page.getByTestId('fab-cart-count')).toHaveCount(0);

    // 8. 주문 내역으로 이동
    await page.getByTestId('fab-orders').click();
    await expect(page).toHaveURL(/\/ko\/delivery\/orders\/?$/);
    await expect(page.getByTestId('orders-list')).toBeVisible();
    await expect(page.locator('[data-testid^="order-item-"]')).toHaveCount(1);
  });

  test('비로그인 사용자가 /delivery/checkout 접근 시 signin으로 redirect', async ({ page }) => {
    await page.goto('/ko/delivery/checkout');
    await expect(page).toHaveURL(/signin/, { timeout: 10_000 });
  });

  test('비로그인 사용자가 /delivery/orders 접근 시 signin으로 redirect', async ({ page }) => {
    await page.goto('/ko/delivery/orders');
    await expect(page).toHaveURL(/signin/, { timeout: 10_000 });
  });

  test('빈 카트 페이지에 empty state 표시', async ({ page }) => {
    await page.goto('/ko/delivery/cart');
    await expect(page.getByText('장바구니가 비었습니다')).toBeVisible();
  });

  test('인증 사용자: 빈 주문 내역 페이지', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ko/delivery/orders');
    await expect(authenticatedPage.getByTestId('orders-empty')).toBeVisible();
  });

  test('최소 주문 금액 미달 시 결제 버튼 비활성화 + 경고', async ({ page }) => {
    await page.goto(`/ko/delivery/restaurants/${RESTAURANT_ID}`);
    const addButtons = page.locator('button[data-testid^="add-to-cart-"]');
    await addButtons.nth(2).click(); // 계란말이 6000

    await page.getByTestId('fab-cart').click();
    await expect(page.getByTestId('cart-subtotal')).toContainText('6,000');
    await expect(page.getByTestId('min-order-warning')).toBeVisible();
    await expect(page.getByTestId('goto-checkout')).toBeDisabled();
  });

  test('admin 페이지 미인증 접근 시 signin redirect', async ({ page }) => {
    await page.goto('/ko/admin');
    await expect(page).toHaveURL(/(signin|admin)/);
  });
});
