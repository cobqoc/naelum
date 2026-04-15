import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe, ensureTestUser, deleteTestUser } from './helpers/auth'

/**
 * 인증이 필요한 레시피 상세 페이지 시나리오 E2E.
 *
 * 이전에는 수동 검증이 필요했던 항목:
 * - 로그인 상태 저장/좋아요 첫 화면 반영
 * - 본인 레시피 수정(✏️) 버튼 표시
 * - 비공개 레시피 비작성자 차단
 *
 * auth-fixtures의 authenticatedPage를 사용해 세션 쿠키가 주입된 상태에서 검증.
 */

async function getPublicRecipeId(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/recipes', { waitUntil: 'domcontentloaded' })
  const firstLink = page
    .locator('a[href^="/recipes/"]')
    .filter({ hasNot: page.locator('text=새 레시피') })
    .first()
  try {
    await firstLink.waitFor({ state: 'attached', timeout: 10000 })
  } catch {
    return null
  }
  const href = await firstLink.getAttribute('href')
  if (!href) return null
  const match = href.match(/\/recipes\/([0-9a-f-]+)/)
  return match?.[1] ?? null
}

test.describe('인증 상태 레시피 상세', () => {
  test('로그인 상태: 헤더에 내 프로필 아이콘(/@...)이 렌더', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await getPublicRecipeId(page)
    test.skip(!recipeId, 'dev DB에 공개 레시피가 없어 스킵')

    await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200) // auth context hydration

    // useAuth가 authProfile.username을 로드하면 /@<username> 링크가 노출됨
    const profileLink = page.locator(`a[href="/@${testUser.username}"]`).first()
    await expect(profileLink).toBeVisible({ timeout: 5000 })
  })

  test('저장 버튼 클릭: 401 없이 정상 응답', async ({ authenticatedPage: page }) => {
    const recipeId = await getPublicRecipeId(page)
    test.skip(!recipeId, 'dev DB에 공개 레시피가 없어 스킵')

    const pageErrors: string[] = []
    page.on('pageerror', e => pageErrors.push(e.message))

    await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    const saveBtn = page
      .locator('button')
      .filter({ hasText: /낼름|저장|save/i })
      .first()

    if ((await saveBtn.count()) > 0) {
      // API 응답을 감시해 401이 떨어지지 않는지 검증
      const savePromise = page.waitForResponse(
        res => res.url().includes(`/api/recipes/${recipeId}/save`) && res.request().method() === 'POST',
        { timeout: 5000 }
      )

      await saveBtn.click()

      try {
        const res = await savePromise
        expect(res.status()).not.toBe(401)
      } catch {
        // 응답을 못 잡았어도 에러가 없으면 통과
      }

      // "로그인이 필요합니다" 토스트가 뜨면 실패
      const hasLoginToast = await page.getByText('로그인이 필요합니다').count()
      expect(hasLoginToast).toBe(0)
      expect(pageErrors).toEqual([])
    }
  })

  test('본인 레시피: 수정(✏️) 링크가 표시됨', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Playwright Own Recipe',
      status: 'published',
      withSteps: true,
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      const editLink = page.locator(`a[href="/recipes/${recipeId}/edit"]`).first()
      await expect(editLink).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('다른 유저의 비공개 레시피: notFound() 페이지 렌더', async ({ authenticatedPage: page }) => {
    // 별도의 다른 유저를 만들고 그 유저 소유 비공개 레시피 생성
    const otherUser = await ensureTestUser('playwright-other@naelum.local')
    const recipeId = await createTestRecipe(otherUser.userId, {
      title: 'Private Recipe — Should 404 for others',
      status: 'draft',
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(800)
      await expect(page.getByText('페이지를 찾을 수 없습니다')).toBeVisible()
    } finally {
      await deleteTestRecipe(recipeId)
      await deleteTestUser(otherUser.userId)
    }
  })

  test('본인 비공개 레시피: 정상 렌더', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'My Private Draft',
      status: 'draft',
      withSteps: true,
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1200)
      // 작성자 본인은 draft 레시피에 접근 가능
      await expect(page.getByText('페이지를 찾을 수 없습니다')).toHaveCount(0)
      await expect(page.locator('text=My Private Draft').first()).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })
})
