import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe('냉장고 같은 이름 재료 자동 판단', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('만료일·보관위치 동일 — 자동 수량 합치기 (1행 유지, quantity 증가)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 시드: 양파 — 모달 추가 시 자동 storage_location='상온' (양파 lookup)이 됨.
    // 만료일도 모달 기본은 null → 시드도 expiry null, storage_location='상온'으로 일치시킴.
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '양파',
      category: 'veggie',
      quantity: 2,
      storage_location: '상온',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // FAB(+) 클릭 → 모달
    await page.locator('button[aria-label="재료 추가"]').first().click();

    // 모달 visible 대기
    const modalScope = page.locator('div.fixed.inset-0.z-\\[60\\]').first();
    await expect(modalScope).toBeVisible({ timeout: 5000 });

    // 모달 내 양파 chip — accessible name은 "🧅 양파" 형태라 :has-text 사용
    const modalOnion = modalScope.locator('button:has-text("양파")').first();
    await expect(modalOnion).toBeVisible({ timeout: 5000 });
    await modalOnion.click({ force: true });

    // "N개 추가하기" 버튼 (i18n: countSuffix + addButton)
    const addBtn = modalScope.locator('button:has-text("1개 추가")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // DB: 1행 유지, quantity 2+1 = 3
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, quantity, expiry_date, storage_location')
      .eq('user_id', testUser.userId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].ingredient_name).toBe('양파');
    expect(rows?.[0].quantity).toBe(3);
  });

  test('만료일 다름 — 자동 따로 추가 (2행, 각자 만료일 보존)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 시드: 양파 (만료일 2026-06-01)
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '양파',
      category: 'veggie',
      quantity: 1,
      expiry_date: '2026-06-01',
      storage_location: '상온',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // FAB → 모달 → 양파 chip (시드는 만료일 6/1, 새로 추가하는 건 만료일 미지정/null → 다름)
    await page.locator('button[aria-label="재료 추가"]').first().click();
    const modalScope = page.locator('div.fixed.inset-0.z-\\[60\\]').first();
    await expect(modalScope).toBeVisible({ timeout: 5000 });

    const modalOnion = modalScope.locator('button:has-text("양파")').first();
    await expect(modalOnion).toBeVisible({ timeout: 5000 });
    await modalOnion.click({ force: true });

    const addBtn = modalScope.locator('button:has-text("1개 추가")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // DB: 2행 (만료일 다르므로 따로 추가됨)
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, quantity, expiry_date')
      .eq('user_id', testUser.userId)
      .order('expiry_date', { ascending: true, nullsFirst: true });
    expect(rows).toHaveLength(2);
    expect(rows?.[0].ingredient_name).toBe('양파');
    expect(rows?.[1].ingredient_name).toBe('양파');
    // 하나는 새 추가(expiry null), 하나는 기존(2026-06-01)
    const hasNull = rows!.some(r => r.expiry_date === null);
    const hasJune = rows!.some(r => r.expiry_date === '2026-06-01');
    expect(hasNull).toBe(true);
    expect(hasJune).toBe(true);
  });

  test('FridgeAllSheet 같은 이름 항목 ×2 배지 노출 (그룹화)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 양파 2행 시드 (만료일 다름 → 따로 저장된 상태)
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: '양파', category: 'veggie', quantity: 1, expiry_date: '2026-06-01', storage_location: '상온' },
      { user_id: testUser.userId, ingredient_name: '양파', category: 'veggie', quantity: 1, expiry_date: '2026-06-15', storage_location: '상온' },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 펜던트 클릭 → FridgeAllSheet 열림
    await page.locator('button:has-text("재료 목록")').first().click({ force: true });
    await page.waitForTimeout(500);

    // 같은 이름 양파 2개 → ×2 배지 노출
    await expect(page.locator('text=×2').first()).toBeVisible({ timeout: 5000 });
  });

  // ─── 사용자 실제 흐름 — 연속 추가 (state stale 회귀 방지) ───
  // 같은 모달을 닫고 다시 열어 같은 재료 두 번 추가했을 때 React state(items)는
  // setItems 비동기 업데이트로 stale 가능. DB 직접 쿼리로 mergeTarget 찾아야 누적됨.
  test('연속 모달 추가 2회 — 시드 1 + 추가 2회 → DB 1행 quantity=3', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 시드: 양파 quantity=1, 상온
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '양파',
      category: 'veggie',
      quantity: 1,
      storage_location: '상온',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // 두 번 연속 모달 추가 (각 모달 별도 호출)
    for (let i = 1; i <= 2; i++) {
      await page.locator('button[aria-label="재료 추가"]').first().click();
      const modalScope = page.locator('div.fixed.inset-0.z-\\[60\\]').first();
      await expect(modalScope).toBeVisible({ timeout: 5000 });
      const modalOnion = modalScope.locator('button:has-text("양파")').first();
      await expect(modalOnion).toBeVisible({ timeout: 5000 });
      await modalOnion.click({ force: true });
      const addBtn = modalScope.locator('button:has-text("1개 추가")').first();
      await expect(addBtn).toBeVisible({ timeout: 5000 });
      await addBtn.click({ force: true });
      await expect(modalScope).toBeHidden({ timeout: 5000 });
      await page.waitForTimeout(500);
    }

    // DB 검증 — 시드 1 + 추가 2 = quantity 3 (1행)
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, quantity')
      .eq('user_id', testUser.userId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].ingredient_name).toBe('양파');
    expect(rows?.[0].quantity).toBe(3);
  });

  // 한 모달 내 batch 추가 — Promise.all 병렬 호출 시에도 자동 합치기 동작 검증
  test('한 모달에서 같은 이름 시드 + 다른 재료 batch 추가 — 양파는 합쳐지고 새 재료는 따로', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });

    // 시드: 양파 1개 (상온, 만료일 null)
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '양파',
      category: 'veggie',
      quantity: 1,
      storage_location: '상온',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // FAB → 모달 → 양파 + 마늘 동시 선택 → "2개 추가" (batch Promise.all)
    await page.locator('button[aria-label="재료 추가"]').first().click();
    const modalScope = page.locator('div.fixed.inset-0.z-\\[60\\]').first();
    await expect(modalScope).toBeVisible({ timeout: 5000 });

    await modalScope.locator('button:has-text("양파")').first().click({ force: true });
    await page.waitForTimeout(200);
    await modalScope.locator('button:has-text("마늘")').first().click({ force: true });
    await page.waitForTimeout(200);

    const addBtn = modalScope.locator('button:has-text("2개 추가")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // DB 검증 — 양파는 1행 quantity=2 (합쳐짐), 마늘은 1행 새로 추가
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, quantity')
      .eq('user_id', testUser.userId);

    const onions = rows?.filter(r => r.ingredient_name === '양파') ?? [];
    const garlics = rows?.filter(r => r.ingredient_name === '마늘') ?? [];
    expect(onions).toHaveLength(1);
    expect(onions[0].quantity).toBe(2); // 시드 1 + 새로 1
    expect(garlics).toHaveLength(1);
  });
});
