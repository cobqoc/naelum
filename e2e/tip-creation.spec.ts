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
 * 검증 패턴: 버튼 클릭 → 저장 성공 시의 네비게이션을 명시적으로 대기
 * (POST 완료 = 확정 신호) → 그 다음 DB 상태 단언. 고정 타임아웃으로 느린
 * POST 를 race 하지 않는다 (병렬 부하 시 flake 방지 — CLAUDE.md e2e 규칙).
 */

async function gotoTipNew(page: Page) {
  await page.goto('/tip/new', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {});
  await expect(page.locator('input[placeholder*="마늘"]').first()).toBeVisible({ timeout: 15000 });
}

async function fillTipForm(page: Page, title: string) {
  await page.locator('input[placeholder*="마늘"]').first().fill(title);
  // 단계 1개(기본) — 공개/비공개 저장은 모든 단계 지시사항 필수
  await page.locator('textarea[placeholder*="할 일"]').first().fill('E2E 단계 지시사항');
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
    // 저장 성공 → 프로필 임시저장 탭으로 이동 (네비게이션 = POST 완료)
    await page.waitForURL((u) => u.searchParams.get('tab') === 'drafts', { timeout: 30000 });
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 10000 })
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
    // 저장 성공 → 프로필 비공개 탭으로 이동
    await page.waitForURL((u) => u.searchParams.get('tab') === 'private', { timeout: 30000 });
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 10000 })
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
    // 저장 성공 → 생성된 팁 상세 페이지(/tip/{uuid})로 이동
    await page.waitForURL((u) => /\/tip\/[0-9a-f-]{36}/.test(u.pathname), { timeout: 30000 });
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 10000 })
      .toBe('true/false');
  });
});
