import { test, expect } from './auth-fixtures';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

test.describe('로그인 홈 — 모바일 헤더 + 만료 임박 배너', () => {
  test.beforeEach(async ({ testUser }) => {
    // 매 테스트마다 user_ingredients 비움 → 시나리오별 격리
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
  });

  test('모바일 헤더 — 로그인 시 글쓰기·프로필 노출, 장바구니는 BottomNav에만', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 모바일 ghost 글쓰기 버튼 — aria-label로 식별 (텍스트는 PC 전용)
    const writeBtnMobile = page.locator('header button[aria-label="글쓰기"]');
    await expect(writeBtnMobile).toBeVisible();

    // 프로필 버튼 (UserDropdown) — aria-label로 식별
    const profileBtn = page.locator('header button[aria-label="프로필 메뉴"]');
    await expect(profileBtn).toBeVisible();

    // 헤더의 장바구니 버튼은 PC 전용 — 모바일에서 노출되지 않아야 함
    // (장바구니는 BottomNav에 있으므로 헤더 중복 방지)
    // DOM에는 존재하지만 hidden md:block으로 display:none → toBeHidden으로 검증
    const cartBtnInHeader = page.locator('header button[aria-label="장보기"]');
    await expect(cartBtnInHeader).toBeHidden();
  });

  test('PC 헤더 — 로그인 시 글쓰기(텍스트)·장바구니·프로필 모두 노출', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // PC 글쓰기 버튼은 "글쓰기" 텍스트 포함
    const writeBtnPC = page.locator('header button:has-text("글쓰기")');
    await expect(writeBtnPC).toBeVisible();

    // 장바구니 버튼 노출
    await expect(page.locator('header button[aria-label="장보기"]')).toBeVisible();

    // 프로필 버튼 노출
    await expect(page.locator('header button[aria-label="프로필 메뉴"]')).toBeVisible();
  });

  test('만료 임박 배너 — 임박 재료 있을 때 노출, 탭 시 임박 시트 열림', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    // D-2 만료 재료 1개 + D-30 만료 재료 1개 seed
    await admin().from('user_ingredients').insert([
      {
        user_id: testUser.userId,
        ingredient_name: '우유',
        category: 'dairy',
        expiry_date: isoDateOffsetDays(2),
        storage_location: '냉장',
      },
      {
        user_id: testUser.userId,
        ingredient_name: '간장',
        category: 'seasoning',
        expiry_date: isoDateOffsetDays(30),
        storage_location: '냉장',
      },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 배너 노출 — aria-label에 "만료 임박 재료" 포함
    const banner = page.locator('button[aria-label*="만료 임박 재료"]');
    await expect(banner).toBeVisible();

    // 탭 → 임박 재료 시트 열림
    // animate-pulse 때문에 stable 안 됨 → force:true로 클릭 강제 (실제 사용자 탭과 동일 결과)
    await banner.click({ force: true });

    // 시트 헤더에 "임박 재료" 표시
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('임박 재료')).toBeVisible();

    // 임박 재료(우유)는 시트에 노출, 만료 먼 재료(간장)는 노출 안 됨
    await expect(dialog.getByText('우유')).toBeVisible();
    await expect(dialog.getByText('간장')).toHaveCount(0);
  });

  test('만료 배너 — 임박 재료 0개일 때 배너 hide', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    // 만료 충분히 먼 재료만 seed
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '간장',
      category: 'seasoning',
      expiry_date: isoDateOffsetDays(30),
      storage_location: '냉장',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 배너 없음
    const banner = page.locator('button[aria-label*="만료 임박 재료"]');
    await expect(banner).toHaveCount(0);

    // 펜던트(재료 목록)는 보임 — 재료가 있으므로
    const pendant = page.locator('button[aria-label*="재료 목록"]');
    await expect(pendant.first()).toBeVisible();
  });

  test('비로그인 — 만료 배너·펜던트 모두 hide', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 만료 배너 없음 (가드: isAuthenticated)
    await expect(page.locator('button[aria-label*="만료 임박 재료"]')).toHaveCount(0);

    // 펜던트 없음 (가드: isAuthenticated)
    await expect(page.locator('button[aria-label="전체 재료 목록"]')).toHaveCount(0);
  });

  // ── 시나리오 A: 실제 추천 매칭 결과 ─────────────────────────────────────
  test('임박 재료로 실제 추천 매칭 — pill 노출 + /recommendations 이동', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    // dev DB에 흔하게 들어간 재료(양파·마늘·돼지고기)를 임박으로 seed → 매칭 가능성 ↑
    await admin().from('user_ingredients').insert([
      { user_id: testUser.userId, ingredient_name: '양파', category: 'veggie', expiry_date: isoDateOffsetDays(2), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: '마늘', category: 'veggie', expiry_date: isoDateOffsetDays(1), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: '돼지고기', category: 'meat', expiry_date: isoDateOffsetDays(3), storage_location: '냉장' },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 배너 → 임박 시트
    const banner = page.locator('button[aria-label*="만료 임박 재료"]');
    await expect(banner).toBeVisible();
    await banner.click({ force: true });

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // 상단 매칭 pill — 로딩(animate-pulse) 끝나면 → 텍스트가 결과로 바뀜.
    // 추천 fetch가 끝날 때까지 대기. "→" 화살표 포함된 결과 버튼이 나오면 통과.
    const sheetCta = dialog.locator('button:has-text("→")');
    await expect(sheetCta).toBeVisible({ timeout: 20000 });

    // CTA 탭 → /recommendations로 이동. URL에 ingredients query가 양파·마늘·돼지고기 중 하나라도 인코딩되어 포함.
    await sheetCta.click({ force: true });
    await expect(page).toHaveURL(/\/recommendations.*ingredients=.*(%EC%96%91%ED%8C%8C|%EB%A7%88%EB%8A%98|%EB%8F%BC%EC%A7%80%EA%B3%A0%EA%B8%B0)/);
  });

  // ── 시나리오 B: 카운트 + 두 매달림 동시 노출 + 시트 필터링 ──────────────
  test('임박+비임박 혼합 — 카운트 정확, 펜던트+배너 동시 노출, 시트 모드별 필터링', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    await admin().from('user_ingredients').insert([
      // 임박 3개
      { user_id: testUser.userId, ingredient_name: '우유', category: 'dairy', expiry_date: isoDateOffsetDays(1), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: '돼지고기', category: 'meat', expiry_date: isoDateOffsetDays(2), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: '양배추', category: 'veggie', expiry_date: isoDateOffsetDays(0), storage_location: '냉장' },
      // 비임박 2개
      { user_id: testUser.userId, ingredient_name: '간장', category: 'seasoning', expiry_date: isoDateOffsetDays(30), storage_location: '냉장' },
      { user_id: testUser.userId, ingredient_name: '쌀', category: 'grain', expiry_date: isoDateOffsetDays(60), storage_location: '상온' },
    ]);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 배너에 정확히 "3개" — aria-label에 카운트 포함
    const banner = page.locator('button[aria-label="만료 임박 재료 3개 보기"]');
    await expect(banner).toBeVisible();

    // 펜던트도 동시에 보임 (재료 있으면 항상 노출)
    const pendant = page.locator('button[aria-label="전체 재료 목록"]');
    await expect(pendant).toBeVisible();

    // 펜던트 탭 → 일반 모드: 5개 모두 노출
    await pendant.click({ force: true });
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    for (const name of ['우유', '돼지고기', '양배추', '간장', '쌀']) {
      await expect(dialog.getByText(name, { exact: false }).first()).toBeVisible();
    }

    // 시트 닫기 — 헤더의 닫기 버튼 (aria-label="닫기"는 시트 헤더에 있음)
    await dialog.locator('button[aria-label="닫기"]').first().click({ force: true });
    await expect(dialog).toHaveCount(0);

    // 배너 탭 → 임박 모드: 임박 3개만, 비임박 2개는 숨김
    await banner.click({ force: true });
    await expect(dialog).toBeVisible();
    for (const name of ['우유', '돼지고기', '양배추']) {
      await expect(dialog.getByText(name, { exact: false }).first()).toBeVisible();
    }
    for (const name of ['간장', '쌀']) {
      await expect(dialog.getByText(name, { exact: false })).toHaveCount(0);
    }
  });

  // ── 시나리오 C: UI로 재료 추가 모달 진입 + 실제 추가 후 배너 갱신 ──────
  // 자동완성 컴포넌트(IngredientAutocompleteV2) 우회를 위해 hybrid 접근:
  //   1) FAB(+) 탭 → 모달 열림 확인 (UI 진입 가능 검증)
  //   2) 모달 닫고 admin client로 D-1 재료 insert → page.reload() → 배너 등장
  test('UI 진입 + 재료 추가 → 배너 자동 등장 + 빈 가이드 사라짐', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    // 빈 냉장고 상태
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 빈 냉장고 가이드 노출
    await expect(page.getByText('냉장고를 채워보세요')).toBeVisible();

    // 배너는 없어야 함 (expiringCount === 0)
    await expect(page.locator('button[aria-label*="만료 임박 재료"]')).toHaveCount(0);
    // 참고: 펜던트는 isAuthenticated만 가드라 items=0이어도 노출됨 (현재 동작).
    // → 빈 냉장고에서 펜던트 hide가 더 자연스럽지만 별도 UX 이슈로 분리.

    // 빈 가이드 CTA(직접 추가하기) 클릭 → AddIngredientModal 열림
    // QuickSeed 칩 6개 위에 있는 fallback 버튼
    const emptyCta = page.locator('button:has-text("직접 추가하기")');
    await expect(emptyCta).toBeVisible();
    await emptyCta.click();

    // 모달이 열렸음을 확인 — 모달 안의 닫기 버튼 등장.
    // (test user는 onboarding_completed=true라 OnboardingBanner의 닫기 버튼은 없음 → 충돌 없음)
    const modalCloseBtn = page.locator('button[aria-label="닫기"]');
    await expect(modalCloseBtn).toBeVisible({ timeout: 5000 });

    // 모달 닫기 (ESC)
    await page.keyboard.press('Escape');
    await expect(modalCloseBtn).toHaveCount(0, { timeout: 5000 });

    // admin client로 D-1 우유 insert (실제 사용자가 입력 완료한 결과를 흉내)
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '우유',
      category: 'dairy',
      expiry_date: isoDateOffsetDays(1),
      storage_location: '냉장',
    });

    // 페이지 새로고침 → SSR이 새 items 반영
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 빈 가이드 사라짐
    await expect(page.getByText('냉장고를 채워보세요')).toHaveCount(0);

    // 배너 노출 (D-1 → isDanger=true)
    await expect(page.locator('button[aria-label="만료 임박 재료 1개 보기"]')).toBeVisible();

    // 펜던트도 노출
    await expect(page.locator('button[aria-label="전체 재료 목록"]')).toBeVisible();
  });

  // ── 시나리오 D: 빈 냉장고 QuickSeed — 1탭으로 재료 추가 ────────────────
  test('빈 냉장고 QuickSeed — 칩 1탭으로 즉시 재료 추가 + 빈 가이드 사라짐', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 빈 가이드 + QuickSeed 그리드 노출
    await expect(page.getByText('냉장고를 채워보세요')).toBeVisible();
    await expect(page.getByText('이런 재료부터 시작해보세요')).toBeVisible();

    // 양파 칩 1탭 → DB insert + 칩 등장
    const onionChip = page.getByRole('button', { name: /양파.*재료 추가/i });
    await expect(onionChip).toBeVisible();
    await onionChip.click();

    // 빈 가이드 사라짐 (items.length > 0)
    await expect(page.getByText('냉장고를 채워보세요')).toHaveCount(0, { timeout: 5000 });

    // DB에 실제 저장됐는지 확인
    const { data } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, category, storage_location')
      .eq('user_id', testUser.userId);
    expect(data).toHaveLength(1);
    expect(data?.[0].ingredient_name).toBe('양파');
    expect(data?.[0].storage_location).toBe('상온');
  });
});
