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
 * 'use client' + Header 라 app/loading.tsx(.animate-bounce) splash 가 먼저 뜰
 * 수 있어 recipe-creation.spec 의 검증된 splash-wait 패턴을 재사용한다.
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
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 15000 })
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
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 15000 })
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
    await expect
      .poll(() => readTipState(testUser.userId, title), { timeout: 15000 })
      .toBe('true/false');
  });
});
