import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const SAMPLE_RECEIPT = `이마트 강남점
2026-05-16
사과 1.5kg 5,900원
우유 1000ml 2,500원
바나나 1송이 3,200원
합계 11,600원`;

test.describe('재료 가격 파싱·저장 (Phase 1)', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('ingredient_price_reports').delete().eq('user_id', testUser.userId);
  });

  test('match-receipt가 가격·수량·단위를 버리지 않고 파싱', async ({ page }) => {
    const res = await page.request.post('/api/ingredients/match-receipt', {
      data: { text: SAMPLE_RECEIPT },
    });
    expect(res.ok()).toBeTruthy();
    const { productLines } = await res.json();
    expect(Array.isArray(productLines)).toBeTruthy();
    expect(productLines.length).toBeGreaterThanOrEqual(1);

    // 사과 줄 — 가격 5900, 수량 1.5, 단위 kg
    const apple = productLines.find((p: { text: string }) => p.text.includes('사과'));
    expect(apple).toBeTruthy();
    expect(apple.parsedPrice).toBe(5900);
    expect(apple.parsedQuantity).toBe(1.5);
    expect(apple.parsedUnit).toBe('kg');
  });

  test('price-report 저장 + price_per_unit 정규화 (kg → 100g당)', async ({
    authenticatedPage,
    testUser,
  }) => {
    // dev ingredients_master에서 재료 하나 확보
    const { data: ing } = await admin()
      .from('ingredients_master')
      .select('id')
      .limit(1)
      .single();
    expect(ing?.id).toBeTruthy();

    const res = await authenticatedPage.request.post('/api/ingredients/price-report', {
      data: {
        ingredientId: ing!.id,
        price: 5900,
        quantity: 1.5,
        unit: 'kg',
        purchaseDate: '2026-05-16',
        source: 'receipt',
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    // 5900 / (1.5 * 1000) * 100 = 393.33 (100g당)
    expect(json.pricePerUnit).toBeCloseTo(393.33, 1);

    // DB 저장 검증
    const { data: rows } = await admin()
      .from('ingredient_price_reports')
      .select('price, quantity, unit, price_per_unit, source')
      .eq('user_id', testUser.userId);
    expect(rows?.length).toBe(1);
    expect(rows![0].price).toBe(5900);
    expect(rows![0].unit).toBe('kg');
    expect(Number(rows![0].price_per_unit)).toBeCloseTo(393.33, 1);
  });

  test('price-report 비로그인 → 401', async ({ page }) => {
    const res = await page.request.post('/api/ingredients/price-report', {
      data: { ingredientId: 'x', price: 1000 },
    });
    expect(res.status()).toBe(401);
  });

  test('price-report 잘못된 가격 → 400', async ({ authenticatedPage }) => {
    const res = await authenticatedPage.request.post('/api/ingredients/price-report', {
      data: { ingredientId: 'x', price: -5 },
    });
    expect(res.status()).toBe(400);
  });
});
