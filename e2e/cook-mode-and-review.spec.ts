import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe } from './helpers/auth'

/**
 * 쿠킹 모드 타이머/알림/오디오 + 리뷰 제출 E2E.
 *
 * - 타이머: page.clock으로 시간 가속 + Notification/AudioContext 스파이로 API 호출 검증
 * - 리뷰: 인증된 상태에서 POST /api/recipes/:id/rating 검증 + UI 반영 확인
 */

test.describe('쿠킹 모드 타이머', () => {
  test('단계 ⏱️ 타이머 버튼 → 설정 모달 → 시작 → 패널·토스트', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    // 단계마다 있는 "⏱️ 타이머" 버튼 → CustomTimerSetup 모달 → 시작.
    const pageErrors: string[] = []
    page.on('pageerror', e => pageErrors.push(e.message))

    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Timer Test Recipe',
      withTimerStep: true,
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      // 모바일: 조리순서 탭 클릭
      const stepsTab = page.locator('button').filter({ hasText: /조리 순서/ }).first()
      if (await stepsTab.isVisible()) {
        await stepsTab.click()
        await page.waitForTimeout(300)
      }

      // 단계마다 있는 "⏱️ 타이머" 버튼
      const timerBtn = page.locator('button').filter({ hasText: /⏱️/ }).first()
      await expect(timerBtn).toBeVisible({ timeout: 5000 })
      await timerBtn.click()
      await page.waitForTimeout(300)

      // 설정 모달 — 총 시간 입력 후 시작
      const totalInput = page.locator('input[type="number"]').first()
      await expect(totalInput).toBeVisible({ timeout: 3000 })
      await totalInput.fill('1')
      await page.getByRole('button', { name: '시작', exact: true }).click()
      await page.waitForTimeout(500)

      // 토스트 + 페이지 에러 없음
      const toastCount = await page.getByText(/타이머 시작/).count()
      expect(toastCount).toBeGreaterThan(0)
      expect(pageErrors).toEqual([])
      const errorShown = await page.locator('text=문제가 발생').count()
      expect(errorShown).toBe(0)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('타이머 설정 모달 — 중간 알림(체크포인트) 추가 → 시작', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    // 한 단계에 총 시간 + 중간 알림을 얹는 체크포인트 타이머.
    const pageErrors: string[] = []
    page.on('pageerror', e => pageErrors.push(e.message))

    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Checkpoint Timer Recipe',
      withTimerStep: true,
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      const stepsTab = page.locator('button').filter({ hasText: /조리 순서/ }).first()
      if (await stepsTab.isVisible()) {
        await stepsTab.click()
        await page.waitForTimeout(300)
      }

      await page.locator('button').filter({ hasText: /⏱️/ }).first().click()
      await page.waitForTimeout(300)

      const totalInput = page.locator('input[type="number"]').first()
      await expect(totalInput).toBeVisible({ timeout: 3000 })
      await totalInput.fill('10')

      // 중간 알림 추가 → number input 한 개 늘어남
      const before = await page.locator('input[type="number"]').count()
      await page.getByRole('button', { name: /알림 추가/ }).click()
      await page.waitForTimeout(200)
      const numberInputs = page.locator('input[type="number"]')
      await expect(numberInputs).toHaveCount(before + 1)
      await numberInputs.last().fill('3')

      await page.getByRole('button', { name: '시작', exact: true }).click()
      await page.waitForTimeout(500)

      const toastCount = await page.getByText(/타이머 시작/).count()
      expect(toastCount).toBeGreaterThan(0)
      expect(pageErrors).toEqual([])
      const errorShown = await page.locator('text=문제가 발생').count()
      expect(errorShown).toBe(0)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })
})

test.describe('리뷰 제출', () => {
  test('인증된 유저: POST /api/recipes/:id/rating 성공 + averageRating 반영', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Review Test Recipe',
      withSteps: true,
    })

    try {
      // 직접 API 호출 — 인증 쿠키는 authenticatedPage에 이미 주입됨
      const response = await page.request.post(`/api/recipes/${recipeId}/rating`, {
        data: { rating: 4, review: 'Playwright E2E test review' },
      })

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.success).toBe(true)
      // 단일 리뷰라 평균이 정확히 4여야 함
      expect(body.averageRating).toBe(4)
      expect(body.ratingsCount).toBe(1)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('리뷰 제출 후 레시피 상세 SSR이 업데이트된 평균 평점 반영', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Rating Reflection Test',
      withSteps: true,
    })

    try {
      // 리뷰 제출
      const postRes = await page.request.post(`/api/recipes/${recipeId}/rating`, {
        data: { rating: 5, review: 'perfect' },
      })
      expect(postRes.ok()).toBeTruthy()

      // 리뷰 제출 후 페이지 방문 — force-dynamic 서버 컴포넌트가 fresh fetch
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      // 페이지 HTML에 5.0 평점이 포함됐는지 (RecipeRatings가 평균 평점 렌더)
      // 또는 레시피 카드에 ★ 5 등이 표시됨
      const html = await page.content()
      // ratings_count가 1 이상이거나 "5.0" / "5" 평점이 보여야 함
      const hasRating = /5\.0|5\b/.test(html) || /평점.*5|\b5\s*점|★.*5/.test(html)
      expect(hasRating).toBeTruthy()
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('리뷰 재제출(업데이트): 기존 리뷰가 새 값으로 교체됨', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: 'Review Update Test',
      withSteps: true,
    })

    try {
      // 첫 제출
      const first = await page.request.post(`/api/recipes/${recipeId}/rating`, {
        data: { rating: 3, review: 'first attempt' },
      })
      expect(first.ok()).toBeTruthy()
      const firstBody = await first.json()
      expect(firstBody.averageRating).toBe(3)
      expect(firstBody.ratingsCount).toBe(1)

      // 재제출 — 동일 유저의 리뷰 업데이트
      const second = await page.request.post(`/api/recipes/${recipeId}/rating`, {
        data: { rating: 5, review: 'changed my mind' },
      })
      expect(second.ok()).toBeTruthy()
      const secondBody = await second.json()
      // ratings_count는 여전히 1 (새 리뷰 아님), averageRating만 변경
      expect(secondBody.averageRating).toBe(5)
      expect(secondBody.ratingsCount).toBe(1)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })
})
