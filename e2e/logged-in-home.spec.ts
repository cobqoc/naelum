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
    // 매 테스트마다 user_ingredients/favorites 비움 → 시나리오별 격리
    await admin().from('user_ingredients').delete().eq('user_id', testUser.userId);
    await admin().from('user_favorites_ingredients').delete().eq('user_id', testUser.userId);
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

    // 빈 가이드 CTA 클릭 → AddIngredientModal 열림(모달 안에서 multi-select)
    const emptyCta = page.locator('button:has-text("냉장고 채우기")');
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

  // ── 시나리오 E: 빈 냉장고 → 모달 → 양파 1탭 → DB 저장 + 빈 가이드 사라짐 ─────
  // 회귀: PostgreSQL date "" → 400 invalid syntax 버그 방어. addIngredientFromModal sanitize.
  test('빈 냉장고 → 모달 → 양파 1탭 → DB 저장 + 빈 가이드 사라짐', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('냉장고를 채워보세요')).toBeVisible();
    await page.locator('button:has-text("냉장고 채우기")').click();

    // IngredientBrowser의 양파 칩 (preset)
    await page.locator('button:has-text("양파")').first().click();
    // 저장 버튼 "1개 추가" (pendingItems.length + countSuffix + addButton)
    await page.locator('button:has-text("1개 추가")').first().click();
    await page.waitForTimeout(1500);

    // 빈 가이드 사라짐
    await expect(page.getByText('냉장고를 채워보세요')).toHaveCount(0, { timeout: 5000 });

    // DB 검증 — sanitize 적용 확인 (빈 문자열 대신 null)
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, expiry_date, purchase_date, ingredient_id')
      .eq('user_id', testUser.userId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].ingredient_name).toBe('양파');
    expect(rows?.[0].expiry_date).toBeNull();
    expect(rows?.[0].purchase_date).toBe(new Date().toISOString().slice(0, 10));
  });

  // ── 시나리오 G: 수정 모드 — 만료일 지우고 저장 → sanitize로 null 저장 ───────
  // 회귀: 수정 시 만료일 input을 비우면 빈 문자열로 보내져 PostgreSQL 22007 발생하던 위험.
  // IngredientForm 1차 sanitize 적용 후 updateIngredient 경로도 자동 안전.
  test('수정 모드 — 만료일 지우고 저장 → DB expiry_date=null', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;

    // 양파 시드 (만료일 D+10)
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId,
      ingredient_name: '양파',
      category: 'veggie',
      expiry_date: isoDateOffsetDays(10),
      purchase_date: isoDateOffsetDays(-1),
      storage_location: '상온',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 양파 chip 클릭 → 액션시트 열림
    const onionChip = page.locator('button[title*="양파"]').first();
    await expect(onionChip).toBeVisible();
    await onionChip.click({ force: true }); // chip의 group hover pt 영향 회피

    // 액션시트 "수정하기" → DetailModal 열림.
    // 고정 sleep 대신 다음 액션 대상("직접 입력" 버튼) 가시성으로 모달 오픈을 결정적 대기.
    await page.locator('button:has-text("수정하기")').first().click();
    const directInputBtn = page.locator('button:has-text("직접 입력")').first();
    await expect(directInputBtn).toBeVisible();

    // 만료일 input 비우기 — "직접 입력" 클릭 후 date input 렌더를 가시성으로 결정적 대기.
    await directInputBtn.click();
    const expiryInput = page.locator('input[type="date"]').nth(1); // [0]=purchase, [1]=expiry
    await expect(expiryInput).toBeVisible();
    await expiryInput.fill('');
    // clear 가 실제 반영된 뒤에만 저장 — 미반영 상태로 저장되던 게 잔존 flake 원인.
    await expect(expiryInput).toHaveValue('');

    // 저장 ("수정 완료")
    const submitBtn = page.locator('button[type="submit"]:has-text("수정 완료")').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 저장(비동기 write) 정착까지 결정적 대기 — 고정 sleep 은 부하 시 write
    // 미커밋 race(flaky). end-state(1행·expiry_date null)를 poll 로 단언.
    await expect.poll(async () => {
      const { data } = await admin()
        .from('user_ingredients').select('expiry_date').eq('user_id', testUser.userId);
      return data?.length === 1 ? data[0].expiry_date : 'pending';
    }, { timeout: 15000 }).toBeNull();

    // DB 검증
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, expiry_date')
      .eq('user_id', testUser.userId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].ingredient_name).toBe('양파');
    expect(rows?.[0].expiry_date).toBeNull();
  });

  // ── 시나리오 F: 모달 → 여러 재료 한 번에 추가 (handleBatchSubmit for loop) ───
  // 회귀: 다중 추가 시 첫 호출 후 모달 닫혀도 batch가 끝까지 진행되며 모두 DB 저장.
  test('모달 → 여러 재료 한 번에 추가 (양파·마늘·계란) → DB 3개 저장', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("냉장고 채우기")').click();

    // 3개 선택
    await page.locator('button:has-text("양파")').first().click();
    await page.locator('button:has-text("마늘")').first().click();
    // "유제품·계란" 탭 버튼과 구별: 탭명에 "유제품" 포함 → 제외
    await page.locator('button:has-text("계란")').filter({ hasNotText: '유제품' }).first().click();
    // 저장
    await page.locator('button:has-text("3개 추가")').first().click();
    await page.waitForTimeout(2000);

    // DB 검증 — 3개 모두 sanitize 적용
    const { data: rows } = await admin()
      .from('user_ingredients')
      .select('ingredient_name, expiry_date, purchase_date, ingredient_id')
      .eq('user_id', testUser.userId);
    expect(rows).toHaveLength(3);
    const names = rows?.map(r => r.ingredient_name).sort();
    expect(names).toEqual(['계란', '마늘', '양파']);
    // 모두 sanitize 적용 — expiry null, purchase_date = 오늘(자동 채우기)
    for (const r of rows ?? []) {
      expect(r.expiry_date).toBeNull();
      expect(r.purchase_date).toBe(new Date().toISOString().slice(0, 10));
    }
  });

  // ── 온보딩 배너 회귀 ──
  // HomeClient 분해 전 안전망(ARCHITECTURE.md: OnboardingBanner 첫 추출 후보, 기존 커버 0).
  // 실제 트리거는 hasTempUsername(임시 username `user_<12hex>` + onboarding_completed=true).
  // onboarding_completed=false면 미들웨어(proxy.ts)가 terms-agreement로 redirect → 홈 도달 불가.
  test('온보딩 배너 — 임시 username 유저: 노출 + CTA→위자드 + X→영구 dismiss', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    const tempUsername = `user_${testUser.userId.replace(/-/g, '').slice(0, 12)}`;
    const { data: orig } = await admin().from('profiles').select('username').eq('id', testUser.userId).single();
    await admin().from('profiles').update({ username: tempUsername, onboarding_completed: true }).eq('id', testUser.userId);
    try {
      await page.goto('/');
      await page.evaluate((uid) => localStorage.removeItem(`naelum_onboarding_banner_${uid}`), testUser.userId);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // (a) 임시 username → 배너 노출
      const bannerTitle = page.getByText('나의 프로필 완성하기');
      await expect(bannerTitle).toBeVisible({ timeout: 10000 });

      // (b) CTA "완성하기" → OnboardingWizard 모달 오픈
      const cta = page.getByRole('button', { name: '완성하기' });
      await cta.click();
      await expect(page.getByText(/프로필 설정 \(\d\/4\)/)).toBeVisible({ timeout: 5000 });

      // wizard 의존 줄이려 reload 로 닫고(LS 아직 dismiss 안 됨 → 배너 재노출) X 검증
      await page.reload({ waitUntil: 'networkidle' });
      await expect(bannerTitle).toBeVisible({ timeout: 10000 });

      // (c) 배너 X(= CTA 의 다음 button 형제) → hide + localStorage 영구 플래그
      await page.getByRole('button', { name: '완성하기' })
        .locator('xpath=following-sibling::button[1]').click();
      await expect(bannerTitle).toHaveCount(0);
      const flag = await page.evaluate((uid) => localStorage.getItem(`naelum_onboarding_banner_${uid}`), testUser.userId);
      expect(flag).toBe('1');

      // (d) reload 후에도 영구 dismiss 유지
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.getByText('나의 프로필 완성하기')).toHaveCount(0);
    } finally {
      // 워커 스코프 fixture — 반드시 원복 (이후 테스트 오염 방지)
      await admin().from('profiles')
        .update({ username: orig?.username ?? testUser.username, onboarding_completed: true })
        .eq('id', testUser.userId);
    }
  });

  test('온보딩 배너 — 정상 username + 온보딩 완료: 배너 미노출 (음성 검증)', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    // 기본 fixture 유저 = username pwtest_*(비-temp) + onboarding_completed=true
    // → needsOnboarding=false → 배너 영구 미노출
    await admin().from('profiles').update({ onboarding_completed: true }).eq('id', testUser.userId);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('나의 프로필 완성하기')).toHaveCount(0);
  });

  // ── 냉장고 칩 상호작용 회귀 ──
  // useFridgeInteractions 추출 전 안전망. 칩 클릭(groupCount===1) → IngredientActionSheet
  // (handleChipClickWithLongPress → setActionItem) → "수정하기" → IngredientDetailModal
  // (handleEditFromSheet → setDetailItem). 펜던트→시트 'all'/배너→임박은 기존 테스트가 커버.
  test('냉장고 칩 클릭 → 액션 시트(만들기/수정/삭제) + 수정→상세 모달', async ({ authenticatedPage, testUser }) => {
    const page = authenticatedPage;
    const name = 'e2e칩양파테스트';
    await admin().from('user_ingredients').insert({
      user_id: testUser.userId, ingredient_name: name, category: 'veggie',
      expiry_date: isoDateOffsetDays(10), storage_location: '냉장',
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 시트 미오픈 초기엔 이 이름의 버튼 = 냉장고 칩 (단일 재료라 groupCount===1)
    const chip = page.getByRole('button', { name: new RegExp(name) });
    await expect(chip.first()).toBeVisible({ timeout: 10000 });
    await chip.first().click({ force: true });

    // 액션 시트: dialog + h3=재료명 + 3 액션
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name })).toBeVisible();
    await expect(sheet.getByText('이 재료로 만들기')).toBeVisible();
    await expect(sheet.getByText('수정하기')).toBeVisible();
    await expect(sheet.getByText('삭제하기')).toBeVisible();

    // "수정하기" → 액션 시트 닫히고 IngredientDetailModal 오픈
    await sheet.getByText('수정하기').click();
    await expect(page.getByText('이 재료로 만들기')).toHaveCount(0); // 액션 시트 닫힘
    // IngredientDetailModal — role=dialog 아님(fixed div). h2 = "{emoji} {재료명} 수정"
    await expect(page.getByRole('heading', { name: new RegExp(`${name}.*수정`) }))
      .toBeVisible({ timeout: 5000 });
  });
});
