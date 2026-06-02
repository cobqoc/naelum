import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe, ensureTestUser } from './helpers/auth'

/**
 * 만들어봤어요 리디자인 UI E2E (2026-06-02).
 *
 * 1단계(만든 직후): MadeItModal = 사진 + 체감 난이도(원탭)만. 맛 별점·후기 없음.
 * 2단계(먹고 나서): 재방문 prompt 배너 → RecipeReviewModal(별점+후기).
 *
 * 비작성자만 🍳 버튼/배너가 보이므로(showMadeIt={!isAuthor}) 레시피는 별도 author로 생성.
 */
test.describe('만들어봤어요 흐름 (1단계 난이도 / 2단계 별점)', () => {
  test('1단계 모달=난이도(별점 없음) → 기록 → 2단계 별점 prompt → 리뷰 모달', async ({
    authenticatedPage: page,
  }) => {
    const author = await ensureTestUser(`madeit-author-${Date.now()}@playwright.test`)
    const recipeId = await createTestRecipe(author.userId, {
      title: `MadeIt Flow ${Date.now()}`,
      withSteps: true,
    })

    try {
      await page.goto(`/recipes/${recipeId}`, { waitUntil: 'load' })

      const madeItBtn = page.getByRole('button', { name: /다 만들었어요/ })
      const stepsTab = page.getByRole('button', { name: /조리 순서/ }).first()
      // hydration 대기 — 데스크톱은 made-it 버튼 직접 노출, 모바일은 조리 순서 탭 노출
      await expect(madeItBtn.or(stepsTab)).toBeVisible({ timeout: 15000 })
      // 모바일이면 조리 순서 탭 전환(데스크톱은 2컬럼이라 탭 숨김)
      if (!(await madeItBtn.isVisible().catch(() => false))) await stepsTab.click()
      await expect(madeItBtn).toBeVisible({ timeout: 15000 })

      // 1단계 모달 — 난이도 버튼 있음, 맛 별점 라벨 없음
      await madeItBtn.click()
      await expect(page.getByText('이 레시피 만들어봤어요!')).toBeVisible()
      await expect(page.getByRole('button', { name: /쉬웠어요/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /어려웠어요/ })).toBeVisible()
      // 옛 흐름의 맛 별점 라벨(별점 (선택))은 1단계에서 사라짐
      await expect(page.getByText('별점 (선택)')).toHaveCount(0)

      // 난이도 선택 후 기록
      await page.getByRole('button', { name: /쉬웠어요/ }).click()
      await page.getByRole('button', { name: '기록 남기기' }).click()

      // 모달 닫힘 + 2단계 재방문 prompt 배너 노출(만들었는데 아직 리뷰 없음)
      await expect(page.getByText('이 레시피 만들어봤어요!')).toHaveCount(0, { timeout: 10000 })
      await expect(page.getByText('이 레시피 만들어보셨네요!')).toBeVisible({ timeout: 10000 })

      // 2단계 — 별점 남기기 → RecipeReviewModal(신규 작성 = "리뷰 작성", 빈 별점)
      await page.getByRole('button', { name: '별점 남기기' }).click()
      await expect(page.getByText('평점을 선택해주세요')).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('heading', { name: '리뷰 작성' })).toBeVisible()
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })
})
