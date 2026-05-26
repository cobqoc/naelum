import type { Page } from '@playwright/test';
import { test, expect } from './auth-fixtures';
import { createTestRecipe, deleteTestRecipe } from './helpers/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * 프로필 페이지(`/@username`, ~928줄 god-file) 분해(Phase 2) 회귀 안전망 — Step 0.
 *
 * profile-edit.spec 은 /settings + PUT API 만 — 이 *페이지* UI(프로필 카드·탭
 * 전환·레시피 그리드·소유자 관리 메뉴·가시성 토글)는 e2e 미커버. 분해 전
 * 이 갭을 메운다(추출이 이 동작들을 깨면 잡아낼 가드). 미분해 코드에서 먼저 green.
 *
 * 'use client' + use(params) 라 app/loading.tsx + 자체 loading(.animate-bounce
 * "낼름...") splash. recipe-edit.spec 의 검증된 splash-wait 패턴 재사용.
 */

async function gotoProfile(page: Page, username: string) {
  await page.goto(`/@${username}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {});
}

test.describe('프로필 페이지 — god-file 분해 회귀 안전망', () => {
  test.beforeEach(async ({ testUser }) => {
    await admin().from('recipes').delete().eq('author_id', testUser.userId);
  });

  test('(1) 프로필 카드 + created 탭 레시피 그리드 렌더 (본인)', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    const recipeId = await createTestRecipe(testUser.userId, {
      title: `E2E 프로필레시피 ${Date.now()}`,
      status: 'published',
    });
    try {
      await gotoProfile(page, testUser.username);

      // ProfileCard: @username 헤딩 + 통계 라벨
      await expect(
        page.getByRole('heading', { name: `@${testUser.username}` })
      ).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('레시피', { exact: true }).first()).toBeVisible();

      // ProfileRecipeGrid: 작성한 레시피 카드 링크
      await expect(page.locator(`a[href*="/recipes/${recipeId}"]`).first()).toBeVisible();

      expect(pageErrors).toEqual([]);
    } finally {
      await deleteTestRecipe(recipeId);
    }
  });

  test('(2) 탭 전환 → URL ?tab= 갱신 + 콘텐츠 변경', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    await gotoProfile(page, testUser.username);
    await expect(
      page.getByRole('heading', { name: `@${testUser.username}` })
    ).toBeVisible({ timeout: 15000 });

    // 낼름함(saved) 탭 클릭 → URL tab=saved + 빈 상태 텍스트
    await page.getByRole('tab', { name: /낼름함/ }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('tab')).toBe('saved');
    await expect(page.getByText('저장한 레시피가 없습니다')).toBeVisible({ timeout: 10000 });
  });

  test('(3) 소유자 관리 메뉴 → 비공개 토글 → DB status 반영', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: `E2E 가시성 ${Date.now()}`,
      status: 'published',
    });
    try {
      await gotoProfile(page, testUser.username);
      const cardLink = page.locator(`a[href*="/recipes/${recipeId}"]`).first();
      await expect(cardLink).toBeVisible({ timeout: 15000 });

      // created 탭 본인 카드의 ⋯ 관리 메뉴 버튼 (카드 컨테이너 한정)
      const card = page
        .locator('div.group.relative')
        .filter({ has: page.locator(`a[href*="/recipes/${recipeId}"]`) })
        .first();
      await card.getByRole('button').first().click();

      // 메뉴 컨테이너로 스코프 (탭 '🔒 비공개' 와 strict 충돌 회피)
      const menu = page
        .locator('div.absolute.right-0')
        .filter({ has: page.getByRole('link', { name: '수정' }) });
      await expect(menu.getByRole('link', { name: '수정' })).toBeVisible();
      await expect(menu.getByRole('button', { name: '비공개' })).toBeVisible();
      await expect(menu.getByRole('button', { name: '삭제' })).toBeVisible();

      // 비공개 토글 → handleToggleVisibility PATCH → DB status=private (end-state poll)
      await menu.getByRole('button', { name: '비공개' }).click();
      await expect
        .poll(
          async () => {
            const { data } = await admin()
              .from('recipes')
              .select('status')
              .eq('id', recipeId)
              .single();
            return data?.status;
          },
          { timeout: 15000, intervals: [500, 1000, 1500, 2000] }
        )
        .toBe('private');
    } finally {
      await deleteTestRecipe(recipeId);
    }
  });
});
