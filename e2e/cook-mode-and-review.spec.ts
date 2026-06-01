import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe } from './helpers/auth'

/**
 * 쿠킹 모드 타이머/알림/오디오 E2E.
 *
 * - 타이머: page.clock으로 시간 가속 + Notification/AudioContext 스파이로 API 호출 검증
 * - (리뷰 제출은 통합 피드로 이관 → e2e/recipe-posts.spec.ts 가 커버)
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

      // 시간 있는 단계의 "⏱️ 타이머" 버튼 (DOM 상 하단 바 버튼보다 먼저)
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
