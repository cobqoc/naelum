import type { Page } from '@playwright/test';
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
 * 팁 작성 — 공개 / 비공개 / 임시저장 3-버튼 회귀 안전망.
 *
 * 옛 UI: "공개 여부" 토글 + [임시저장][팁 공유하기] 2버튼. 비공개로 저장하려면
 * "팁 공유하기"(공개해 보이는 버튼)를 눌러야 하는 함정 → 비공개 의도가
 * 임시저장(is_draft=true)으로 새던 버그(2026-05-21 수정). 이제 버튼 3개가
 * 각각 정확한 DB 상태를 만든다:
 *   임시저장     → is_public=false, is_draft=true
 *   비공개로 저장 → is_public=false, is_draft=false
 *   팁 공유하기   → is_public=true,  is_draft=false
 *
 * 검증 패턴: 버튼 클릭 → DB 상태를 expect.poll 로 직접 폴링. 네비게이션을
 * 완료 프록시로 쓰지 않는다 — waitForURL 이 무거운 프로필 페이지 로딩에
 * race 가 걸려 병렬 부하 시 flake 했음(2026-05-22). 폴링이 곧 완료 대기다.
 */

async function gotoTipNew(page: Page) {
  await page.goto('/tip/new', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {});
  await expect(page.locator('input[placeholder*="마늘"]').first()).toBeVisible({ timeout: 15000 });
}

/**
 * 하이드레이션 안전 fill — 값이 *실제로 React state 에 반영됐는지* 확인 후 진행.
 *
 * **왜**: 병렬 부하(2 worker)에서 폼이 SSR/렌더는 됐지만 React 하이드레이션 전이면
 * `.fill()` 이 DOM value 만 세팅하고 onChange 가 안 붙어 state 는 빈 채로 남는다.
 * 하이드레이션이 끝나면 controlled input 이 빈 state 로 다시 그려 **값이 사라진다**
 * → 제출 시 "제목을 입력해주세요" 검증 실패 → POST 안 감 → DB row 없음(=flake).
 * (라이브 실패 스크린샷으로 확정 — 2026-06-01. DB contention 아님, 하이드레이션 race.)
 *
 * toPass 로 "fill → 값 유지 확인" 을 재시도: 하이드레이션 전이면 값이 지워져 재fill,
 * 하이드레이션 후 값이 붙으면 통과. 타임아웃 땜질이 아니라 *전제조건 보장*.
 */
async function fillStable(locator: ReturnType<Page['locator']>, value: string) {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

async function fillTipForm(page: Page, title: string) {
  await fillStable(page.locator('input[placeholder*="마늘"]').first(), title);
  // 단계 1개(기본) — 공개/비공개 저장은 모든 단계 지시사항 필수
  await fillStable(page.locator('textarea[placeholder*="할 일"]').first(), 'E2E 단계 지시사항');
}

/** 생성된 팁의 `is_public/is_draft` 를 문자열로 — 없으면 null */
async function readTipState(userId: string, title: string) {
  const { data } = await admin()
    .from('tip')
    .select('is_public, is_draft')
    .eq('author_id', userId)
    .eq('title', title)
    .maybeSingle();
  return data ? `${data.is_public}/${data.is_draft}` : null;
}

test.describe('팁 작성 — 공개/비공개/임시저장 3-버튼', () => {
  test.beforeEach(async ({ testUser }) => {
    // 팁 생성 POST(tip + steps insert)는 스위트에서 가장 무거운 쓰기 —
    // 병렬 부하 피크에서 느려질 수 있어 per-test 예산을 넉넉히 (기본 60s → 120s).
    // 고정 sleep 이 아니라 폴링 상한 — 정상 동작은 1~3초에 끝난다.
    test.setTimeout(120_000);
    await admin().from('tip').delete().eq('author_id', testUser.userId);
  });
  test.afterEach(async ({ testUser }) => {
    await admin().from('tip').delete().eq('author_id', testUser.userId);
  });

  test('[임시저장] → is_public=false, is_draft=true', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const title = `E2E 팁 임시저장 ${Date.now()}`;
    await gotoTipNew(page);
    await fillTipForm(page, title);
    await page.getByRole('button', { name: '임시저장', exact: true }).click();
    // 클릭 → POST → DB 반영을 직접 폴링 (expect.poll 이 곧 완료 대기)
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 60000 })
      .toBe('false/true');
  });

  test('[비공개로 저장] → is_public=false, is_draft=false (private)', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const title = `E2E 팁 비공개 ${Date.now()}`;
    await gotoTipNew(page);
    await fillTipForm(page, title);
    await page.getByRole('button', { name: '비공개로 저장', exact: true }).click();
    // 클릭 → POST → DB 반영을 직접 폴링 (expect.poll 이 곧 완료 대기)
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 60000 })
      .toBe('false/false');
  });

  test('[팁 공유하기] → is_public=true, is_draft=false (public)', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const title = `E2E 팁 공개 ${Date.now()}`;
    await gotoTipNew(page);
    await fillTipForm(page, title);
    await page.getByRole('button', { name: '팁 공유하기', exact: true }).click();
    // 클릭 → POST → DB 반영을 직접 폴링 (expect.poll 이 곧 완료 대기)
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 60000 })
      .toBe('true/false');
  });
});
