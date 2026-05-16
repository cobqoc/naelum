import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 배달 지도 / 푸드트럭 — Phase 0+1.
// 지도 자체는 maplibre canvas라 마커 픽셀 단언 불가 → API·DB·페이지 셸·RLS 경로를 검증.
// 진입은 admin 전용(robots noindex) — 직접 URL은 정책상 접근 가능.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
function anon() {
  return createSupabaseClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** 식당 사전 데이터를 INSERT하고 같은 왕복(.select().single())으로 커밋을 확정한다.
 *  bare insert는 에러를 삼키고(데이터 미생성 → 후속 폴/페이지가 stale 관측), 별도
 *  read-after-write 폴은 회귀 전체 DB 부하에서 그 자체가 flaky 표면이 된다.
 *  RETURNING으로 한 번에 "에러 없음 + 커밋된 행"을 보장하는 게 가장 견고. */
async function seedRestaurant(
  fields: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await admin()
    .from('delivery_restaurants')
    .insert(fields)
    .select('id')
    .single();
  expect(error, `식당 사전 INSERT 실패: ${error?.message ?? ''}`).toBeNull();
  expect(data?.id).toBeTruthy();
  return data!.id as string;
}

// 서울 도심 bbox (한 변 < 5°)
const BBOX = { west: 126.9, south: 37.5, east: 127.05, north: 37.62 };
const INSIDE = { lat: 37.5665, lng: 126.9784 }; // 서울 시청
const OUTSIDE = { lat: 35.1796, lng: 129.0756 }; // 부산

interface NearbyResp {
  places: { name: string; placeType: string; isOpen: boolean }[];
}

// 아래 3개 describe는 모두 per-worker testUser의 delivery_restaurants를 변형한다.
// fullyParallel에서 형제 테스트가 여러 worker에 흩어지면, 페이지 SSR이 방금 insert한
// row를 읽기 전에 다른 테스트의 beforeEach delete/insert가 끼어들어 flaky해진다.
// serial → 한 worker에 직렬 고정, 첫 실패 시 잔여 스킵(retry worker churn 방지).
test.describe('배달 지도 — nearby API', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ testUser }) => {
    await admin().from('delivery_restaurants').delete().eq('owner_id', testUser.userId);
  });

  test('bbox 누락 → 400', async ({ page }) => {
    const res = await page.request.get('/api/delivery/nearby');
    expect(res.status()).toBe(400);
  });

  test('잘못된 bbox(west>=east) → 400', async ({ page }) => {
    const res = await page.request.get(
      '/api/delivery/nearby?west=127&south=37.5&east=126.9&north=37.6',
    );
    expect(res.status()).toBe(400);
  });

  test('너무 큰 bbox(±5° 초과) → 400', async ({ page }) => {
    const res = await page.request.get(
      '/api/delivery/nearby?west=120&south=33&east=132&north=39',
    );
    expect(res.status()).toBe(400);
  });

  test('bbox 내 활성 식당만 반환 + place_type/open 필터', async ({ page, testUser }) => {
    const a = admin();
    const ins = await a
      .from('delivery_restaurants')
      .insert([
        { owner_id: testUser.userId, name: 'E2E Map In Open', cuisine_types: ['한식'], lat: INSIDE.lat, lng: INSIDE.lng, is_active: true, is_open: true, place_type: 'restaurant' },
        { owner_id: testUser.userId, name: 'E2E Map In Truck', cuisine_types: ['분식'], lat: INSIDE.lat + 0.001, lng: INSIDE.lng + 0.001, is_active: true, is_open: false, place_type: 'food_truck' },
        { owner_id: testUser.userId, name: 'E2E Map Out', cuisine_types: ['한식'], lat: OUTSIDE.lat, lng: OUTSIDE.lng, is_active: true, is_open: true, place_type: 'restaurant' },
        { owner_id: testUser.userId, name: 'E2E Map Inactive', cuisine_types: ['한식'], lat: INSIDE.lat, lng: INSIDE.lng, is_active: false, is_open: true, place_type: 'restaurant' },
      ]);
    expect(ins.error).toBeNull();

    const q = `west=${BBOX.west}&south=${BBOX.south}&east=${BBOX.east}&north=${BBOX.north}`;

    const res = await page.request.get(`/api/delivery/nearby?${q}`);
    expect(res.status()).toBe(200);
    const names = ((await res.json()) as NearbyResp).places.map((p) => p.name);
    expect(names).toContain('E2E Map In Open');
    expect(names).toContain('E2E Map In Truck');
    expect(names).not.toContain('E2E Map Out'); // bbox 밖
    expect(names).not.toContain('E2E Map Inactive'); // 비활성 (RLS + 명시 필터)

    const rNames = (
      (await (await page.request.get(`/api/delivery/nearby?${q}&type=restaurant`)).json()) as NearbyResp
    ).places.map((p) => p.name);
    expect(rNames).toContain('E2E Map In Open');
    expect(rNames).not.toContain('E2E Map In Truck');

    const oNames = (
      (await (await page.request.get(`/api/delivery/nearby?${q}&open=1`)).json()) as NearbyResp
    ).places.map((p) => p.name);
    expect(oNames).toContain('E2E Map In Open');
    expect(oNames).not.toContain('E2E Map In Truck'); // is_open=false
  });
});

test.describe('사장님 — 업장 형태(place_type) 토글', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ testUser }) => {
    await admin().from('delivery_restaurants').delete().eq('owner_id', testUser.userId);
  });

  test('가게정보에서 푸드트럭 전환 → DB 반영', async ({ authenticatedPage, testUser }) => {
    await seedRestaurant({
      owner_id: testUser.userId,
      name: 'E2E PlaceType',
      cuisine_types: ['한식'],
      delivery_fee: 3000,
      min_order_price: 12000,
      avg_cook_time_min: 25,
      is_active: true,
      is_open: false,
    });

    const page = authenticatedPage;
    await page.goto('/ko/merchant/restaurant', { waitUntil: 'domcontentloaded' });
    // 머천트 레이아웃 auth fetch + 폼 hydration 안정화 대기 (dynamic 지도 청크와 무관하게 폼 우선)
    const select = page.getByTestId('edit-place-type');
    await expect(select).toBeVisible({ timeout: 15_000 });
    await select.selectOption('food_truck');
    const saveBtn = page.getByTestId('edit-save');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.getByTestId('edit-saved')).toBeVisible({ timeout: 10_000 });

    const { data } = await admin()
      .from('delivery_restaurants')
      .select('place_type')
      .eq('owner_id', testUser.userId)
      .single();
    expect(data?.place_type).toBe('food_truck');
  });
});

test.describe('사장님 — 푸드트럭 위치 공개', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ testUser }) => {
    await admin().from('delivery_restaurants').delete().eq('owner_id', testUser.userId);
  });

  test('비-푸드트럭은 안내 메시지만', async ({ authenticatedPage, testUser }) => {
    await seedRestaurant({
      owner_id: testUser.userId,
      name: 'E2E LocResto',
      cuisine_types: ['한식'],
      delivery_fee: 3000,
      min_order_price: 12000,
      avg_cook_time_min: 25,
      is_active: true,
      is_open: false,
      place_type: 'restaurant',
    });
    const page = authenticatedPage;
    await page.goto('/ko/merchant/location', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByText('푸드트럭으로 설정된 업장만 위치를 공개할 수 있어요'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('위치 공개 → live row 생성 → 재공개 시 1개 유지 → 종료', async ({ authenticatedPage, testUser }) => {
    const a = admin();
    const rid = await seedRestaurant({
      owner_id: testUser.userId,
      name: 'E2E LocTruck',
      cuisine_types: ['분식'],
      delivery_fee: 0,
      min_order_price: 0,
      avg_cook_time_min: 15,
      is_active: true,
      is_open: true,
      place_type: 'food_truck',
    });

    const page = authenticatedPage;
    await page.goto('/ko/merchant/location', { waitUntil: 'domcontentloaded' });

    const labelInput = page.getByTestId('loc-label');
    await expect(labelInput).toBeVisible({ timeout: 15_000 });
    await labelInput.fill('E2E 강남역');
    await page.getByTestId('loc-publish').click();
    await expect(page.getByTestId('loc-end')).toBeVisible({ timeout: 12_000 });

    const live1 = await a
      .from('delivery_truck_locations')
      .select('id, label')
      .eq('restaurant_id', rid)
      .eq('status', 'live');
    expect(live1.data?.length).toBe(1);
    expect(live1.data?.[0].label).toBe('E2E 강남역');

    // 재공개 — 기존 live는 ended, 항상 1개만 live
    await page.getByTestId('loc-publish').click();
    await expect(page.getByTestId('loc-end')).toBeVisible();
    await expect(async () => {
      const liveN = await a
        .from('delivery_truck_locations')
        .select('id')
        .eq('restaurant_id', rid)
        .eq('status', 'live');
      expect(liveN.data?.length).toBe(1);
    }).toPass({ timeout: 8_000 });

    // 영업 종료
    await page.getByTestId('loc-end').click();
    await expect(page.getByText('현재 공개된 위치가 없습니다')).toBeVisible({ timeout: 10_000 });
    const liveEnd = await a
      .from('delivery_truck_locations')
      .select('id')
      .eq('restaurant_id', rid)
      .eq('status', 'live');
    expect(liveEnd.data?.length).toBe(0);
  });

  test('공개된 live 위치는 anon RLS로 조회 가능 (소비자 지도 데이터 경로)', async ({ testUser }) => {
    const a = admin();
    const rid = await seedRestaurant({
      owner_id: testUser.userId,
      name: 'E2E LocRLS',
      cuisine_types: ['분식'],
      delivery_fee: 0,
      min_order_price: 0,
      avg_cook_time_min: 15,
      is_active: true,
      is_open: true,
      place_type: 'food_truck',
    });
    await a.from('delivery_truck_locations').insert({
      restaurant_id: rid,
      lat: 37.4979,
      lng: 127.0276,
      label: 'E2E live',
      status: 'live',
      starts_at: new Date().toISOString(),
    });

    const { data, error } = await anon()
      .from('delivery_truck_locations')
      .select('id, restaurant:delivery_restaurants(name, is_active)')
      .eq('status', 'live')
      .eq('restaurant_id', rid);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
});

test.describe('소비자 지도 페이지', () => {
  test('셸 렌더 + 범례 + robots noindex (검색엔진 차단 게이팅)', async ({ page }) => {
    await page.goto('/ko/delivery/map', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/delivery\/map/);
    await expect(page.getByRole('heading', { name: '배달 지도' })).toBeVisible();
    // 범례 — MapView(dynamic)에서 렌더
    await expect(page.getByText('식당', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('푸드트럭', { exact: false }).first()).toBeVisible();

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });
});
