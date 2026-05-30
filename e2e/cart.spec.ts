import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('장보기 카트 — 스모크 테스트', () => {
  test.beforeEach(async ({ testUser }) => {
    // 매 테스트마다 cart/fridge/favorites 비우기 — 트리거로 자동 생성되는 favorites도 정리해야 다음 spec 영향 없음
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('PC 헤더에서 cart 버튼 클릭 → dropdown 열림 + 비어있는 상태 표시', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cartBtn = page.locator('header button[aria-label="장보기"]');
    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    // dropdown 내부의 title (헤더 카트 dropdown 한정)
    await expect(page.getByText('장보기', { exact: false }).first()).toBeVisible();
    // 빈 상태 메시지
    await expect(page.getByText('위 입력창에서 재료를 추가해보세요')).toBeVisible();
  });

  test('직접 입력 → 추가 → 리스트에 표시 + 진행률 0% + cart 배지 증가', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('header button[aria-label="장보기"]').click();

    const input = page.getByPlaceholder('재료 검색 또는 직접 입력...');
    await input.fill('테스트양파');
    await input.press('Enter');

    // 추가된 아이템 노출 확인
    await expect(page.locator('text=테스트양파').first()).toBeVisible({ timeout: 5000 });
    // 진행률 바: 1개 중 0개 체크
    await expect(page.getByText('0/1 체크됨')).toBeVisible();

    // 카트 배지 (1) — header 카트 버튼 옆 absolute span
    const cartBtn = page.locator('header button[aria-label="장보기"]');
    await expect(cartBtn.getByText('1', { exact: true })).toBeVisible();
  });

  test('체크 → 진행률 100% + 액션 버튼 노출 → 냉장고로 이동 → user_ingredients에 저장', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 사전 시드: shopping_list_items에 1개 직접 삽입
    // (UI 흐름 단축 — 추가 단계는 다른 테스트에서 검증)
    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: sl!.id,
      ingredient_name: '테스트당근',
      category: 'veggie',
      is_checked: false,
      is_owned: false,
    });

    await page.locator('header button[aria-label="장보기"]').click();
    const itemRow = page.locator('text=테스트당근').first();
    await expect(itemRow).toBeVisible({ timeout: 5000 });

    // 체크 (행 클릭)
    await itemRow.click();
    await expect(page.getByText('1/1 체크됨')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();

    // 냉장고에 추가 버튼
    const addBtn = page.getByRole('button', { name: /냉장고에 추가/ });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // toast: "1개 재료가 냉장고에 추가됐어요!"
    await expect(page.getByText('1개 재료가 냉장고에 추가됐어요!')).toBeVisible({ timeout: 5000 });

    // DB 검증: user_ingredients에 테스트당근 존재
    const { data: fridge } = await admin()
      .from('user_ingredients')
      .select('ingredient_name')
      .eq('user_id', testUser.userId);
    expect(fridge?.some(i => i.ingredient_name === '테스트당근')).toBe(true);

    // shopping_list_items에서는 제거됐는지
    const { data: cart } = await admin()
      .from('shopping_list_items')
      .select('id')
      .eq('user_id', testUser.userId);
    expect(cart?.length ?? 0).toBe(0);
  });

  test('항목 수량 +/- 스테퍼 동작', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: sl!.id,
      ingredient_name: '테스트감자',
      category: 'veggie',
      quantity: 1,
      is_checked: false,
      is_owned: false,
    });

    await page.locator('header button[aria-label="장보기"]').click();
    await expect(page.locator('text=테스트감자').first()).toBeVisible({ timeout: 5000 });

    // + 스테퍼 2번 클릭 → 수량 3
    const incBtn = page.locator('button[aria-label="수량 증가"]').first();
    await incBtn.click();
    await incBtn.click();

    // DB 검증 — 디바운스 쓰기 커밋까지 폴링 (고정 sleep 금지: 부하 시 race)
    const readQty = async () => {
      const { data } = await admin()
        .from('shopping_list_items')
        .select('quantity')
        .eq('user_id', testUser.userId)
        .eq('ingredient_name', '테스트감자')
        .single();
      return data?.quantity;
    };
    await expect.poll(readQty, { timeout: 10000 }).toBe(3);

    // - 1회 → 2
    await page.locator('button[aria-label="수량 감소"]').first().click();
    await expect.poll(readQty, { timeout: 10000 }).toBe(2);
  });

  test('비로그인 — 헤더에 cart 버튼 노출되지 않음 (BottomNav cart에서 로그인 유도)', async ({ page }) => {
    // 비로그인은 PC 헤더에 cart 버튼이 아예 노출되지 않음 (user 있을 때만 렌더)
    // 모바일에선 BottomNav cart 버튼이 보이고, 클릭 시 로그인 유도 뷰 노출
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // BottomNav의 cart 버튼 — md:hidden BottomNav 내부 한정
    const bottomNavCart = page.locator('nav.md\\:hidden button[aria-label="장보기"]');
    await expect(bottomNavCart).toBeVisible();
    await bottomNavCart.click();

    await expect(page.getByText('로그인하고 장보기 시작')).toBeVisible();
    await expect(page.getByRole('link', { name: /로그인하고 시작하기/ })).toBeVisible();
  });

  test('모바일 BottomNav cart 버튼 → dropdown 열림', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // BottomNav 한정 (헤더의 PC-only cart 버튼은 hidden md:block — 모바일에선 보이지 않지만 DOM엔 있음)
    const cartNavBtn = page.locator('nav.md\\:hidden button[aria-label="장보기"]');
    await expect(cartNavBtn).toBeVisible();
    await cartNavBtn.click();

    await expect(page.getByText('장보기').first()).toBeVisible();
  });

  // ─── 신규 기능 검증 (#1 ~ #6) ───

  test('#1 보유 재료 — is_owned=true 항목에 냉장고 아이콘 표시 (탭 시 안내)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 사전: user_ingredients에 양파 추가 → cart에 같은 이름 직접 추가하면 is_owned=true로 저장됨
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '테스트양파_보유',
      category: 'veggie',
    });
    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: sl!.id,
      ingredient_name: '테스트양파_보유',
      category: 'veggie',
      is_checked: false,
      is_owned: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[aria-label="장보기"]').click();
    await expect(page.locator('text=테스트양파_보유').first()).toBeVisible({ timeout: 5000 });

    // 보유 표시 — 냉장고 아이콘 버튼(텍스트 배지 → 아이콘, 이름 공간 확보). aria-label = 안내 메시지.
    await expect(page.getByRole('button', { name: '냉장고에 이미 있는 재료예요' }).first()).toBeVisible();
  });

  test('#2 단위 드롭다운 — 직접 추가 시 단위 선택 → DB에 저장', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[aria-label="장보기"]').click();

    // 단위 select에서 'kg' 선택 → 직접 입력 → 추가
    await page.locator('select[aria-label="단위"]').first().selectOption('kg');
    const input = page.getByPlaceholder('재료 검색 또는 직접 입력...');
    await input.fill('테스트소고기');
    await input.press('Enter');

    await expect(page.locator('text=테스트소고기').first()).toBeVisible({ timeout: 5000 });

    // DB 검증
    const { data } = await admin()
      .from('shopping_list_items')
      .select('unit')
      .eq('user_id', testUser.userId)
      .eq('ingredient_name', '테스트소고기')
      .single();
    expect(data?.unit).toBe('kg');
  });

  test('#3 동일 재료 합산 — 같은 이름 두 번 추가 시 quantity 합쳐짐', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert({
      user_id: testUser.userId,
      shopping_list_id: sl!.id,
      ingredient_name: '테스트양배추',
      category: 'veggie',
      quantity: 2,
      is_checked: false,
      is_owned: false,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[aria-label="장보기"]').click();
    await expect(page.locator('text=테스트양배추').first()).toBeVisible({ timeout: 5000 });

    // 같은 이름 직접 추가 → quantity 합산되어야 함 (기존 2 + 새로 1 = 3)
    const input = page.getByPlaceholder('재료 검색 또는 직접 입력...');
    await input.fill('테스트양배추');
    await input.press('Enter');

    // 한 행만 있어야 하고 quantity = 2 + 1 = 3 — 커밋까지 폴링 (고정 sleep 금지)
    await expect.poll(async () => {
      const { data } = await admin()
        .from('shopping_list_items')
        .select('quantity')
        .eq('user_id', testUser.userId)
        .eq('ingredient_name', '테스트양배추');
      return `${data?.length ?? 0}:${data?.[0]?.quantity ?? 0}`;
    }, { timeout: 10000 }).toBe('1:3');
  });

  test('#4 체크 항목 숨김 토글 — 체크된 항목 hide/show', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert([
      { user_id: testUser.userId, shopping_list_id: sl!.id, ingredient_name: '테스트사과', category: 'fruit', is_checked: true, is_owned: false },
      { user_id: testUser.userId, shopping_list_id: sl!.id, ingredient_name: '테스트배', category: 'fruit', is_checked: false, is_owned: false },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[aria-label="장보기"]').click();
    // 2026-05-16 개편: starred 항목이 quick-add 칩으로도 노출 → text= 가 칩과 충돌.
    // 실제 "목록"에서의 숨김/표시를 검증하는 게 이 테스트의 의도이므로 list로 scope.
    const cartList = page.locator('[data-testid="cart-list"]');
    await expect(cartList.locator('text=테스트사과').first()).toBeVisible({ timeout: 5000 });
    await expect(cartList.locator('text=테스트배').first()).toBeVisible();

    // 숨김 토글 클릭
    await page.getByRole('button', { name: /완료 항목 숨기기/ }).click();
    await expect(cartList.locator('text=테스트사과')).toHaveCount(0);
    await expect(cartList.locator('text=테스트배').first()).toBeVisible();

    // 다시 토글 → 모두 보기
    await page.getByRole('button', { name: /모두 보기/ }).click();
    await expect(cartList.locator('text=테스트사과').first()).toBeVisible();
  });

  test('#5 전체 비우기 — confirm 후 모든 항목 삭제', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    const { data: sl } = await admin()
      .from('shopping_lists')
      .insert({ user_id: testUser.userId, list_name: '기본' })
      .select('id')
      .single();
    await admin().from('shopping_list_items').insert([
      { user_id: testUser.userId, shopping_list_id: sl!.id, ingredient_name: '테스트김치', category: 'veggie', is_checked: false, is_owned: false },
      { user_id: testUser.userId, shopping_list_id: sl!.id, ingredient_name: '테스트밥', category: 'grain', is_checked: false, is_owned: false },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('header button[aria-label="장보기"]').click();
    const cartList = page.locator('[data-testid="cart-list"]');
    await expect(cartList.locator('text=테스트김치').first()).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /전체 비우기/ }).click();

    // 빈 상태로 전환됨 — 2026-05-16 개편으로 '자주 추가하는 재료' 헤딩 제거,
    // 빈 상태는 emptyHint placeholder 로 표시된다.
    await expect(page.getByText('위 입력창에서 재료를 추가해보세요')).toBeVisible({ timeout: 5000 });

    // DB 검증 — 삭제 커밋까지 폴링 (고정 sleep 금지)
    await expect.poll(async () => {
      const { data } = await admin()
        .from('shopping_list_items')
        .select('id')
        .eq('user_id', testUser.userId);
      return data?.length ?? 0;
    }, { timeout: 10000 }).toBe(0);
  });

  test('#6 빈 상태 quick-add — 자주 추가하는 재료 버튼 원탭 추가', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 진입 전 cart 명시적 비우기 (DB + 트리거로 생긴 favorites도 함께)
    await admin().from('shopping_list_items').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);

    await page.goto('/');
    // shopping-list module-level cache 새로 init 위해 hard reload
    await page.reload({ waitUntil: 'load' });

    await page.locator('header button[aria-label="장보기"]').click();

    // 빈 상태 quick-add 영역으로 scope 한정 (cart 항목과 quick-add 영역에 동시에 "양파"가 있을 가능성 차단).
    // 2026-05-16 개편으로 '자주 추가하는 재료' 헤딩 제거 → 안정적인 cart-quick-add testid 로 scope.
    const quickAddArea = page.locator('[data-testid="cart-quick-add"]');
    await expect(quickAddArea).toBeVisible({ timeout: 10000 });

    // quick-add 영역의 양파 버튼만 클릭 — 새 UI에선 ⭐ 토글과 별도 main button
    await quickAddArea.getByRole('button', { name: '양파', exact: true }).click();

    // DB에 양파 1개 들어갈 때까지 poll
    await expect.poll(
      async () => {
        const { data } = await admin()
          .from('shopping_list_items')
          .select('ingredient_name')
          .eq('user_id', testUser.userId);
        return data?.length ?? 0;
      },
      { timeout: 5000 }
    ).toBe(1);

    const { data } = await admin()
      .from('shopping_list_items')
      .select('ingredient_name, category')
      .eq('user_id', testUser.userId);
    expect(data?.[0].ingredient_name).toBe('양파');
    expect(data?.[0].category).toBe('veggie'); // DB ingredients_master 카테고리 그대로 저장
  });
});
