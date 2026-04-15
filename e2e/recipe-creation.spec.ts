import { test, expect } from './auth-fixtures'
import { deleteTestRecipe } from './helpers/auth'

/**
 * 레시피 작성 플로우 E2E.
 *
 * 1564줄 폼의 모든 필드를 채우는 건 비현실적이라, 다음에 집중한다:
 * - 로그인 유저가 /recipes/new 페이지에 접근 가능 + 핵심 필드 렌더
 * - 미인증 유저는 /login으로 리다이렉트
 * - POST /api/recipes 최소 payload로 호출 → 201 + DB 반영 + 홈 피드에 노출
 *
 * UI 폼 세부 인터랙션은 수동 QA / 사용자 피드백에 맡긴다.
 */

test.describe('레시피 작성', () => {
  test('미인증 유저: /recipes/new 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/recipes/new', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    // 미들웨어가 /login으로 리다이렉트
    expect(page.url()).toContain('/login')
  })

  test('인증 유저: /recipes/new 폼 렌더 (핵심 필드 visible)', async ({ authenticatedPage: page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto('/recipes/new', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // 제목 input이 있어야 함 (떡볶이 예시 placeholder)
    const titleInput = page.locator('input[placeholder*="떡볶이"], input[placeholder*="만드는건"]').first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    // "재료" 섹션 텍스트
    const ingredientsSection = page.getByText(/재료/).first()
    await expect(ingredientsSection).toBeVisible()

    // "조리" 또는 "단계" 섹션 텍스트
    const stepsSection = page.getByText(/조리|단계/).first()
    await expect(stepsSection).toBeVisible()

    // 에러 없이 렌더됐는지
    expect(pageErrors).toEqual([])
  })

  test('POST /api/recipes: 최소 payload로 published 레시피 생성 성공', async ({ authenticatedPage: page }) => {
    const title = `E2E Test Recipe ${Date.now()}`
    const response = await page.request.post('/api/recipes', {
      data: {
        title,
        description: 'E2E 테스트 레시피',
        cuisine_type: 'other',
        dish_type: 'other',
        difficulty_level: 'easy',
        servings: 2,
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        status: 'published',
        ingredients: [
          { ingredient_name: '소금', quantity: 1, unit: 'tsp' },
          { ingredient_name: '물', quantity: 1, unit: 'cup' },
        ],
        steps: [
          { instruction: '물을 끓인다' },
          { instruction: '소금을 넣는다' },
        ],
      },
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.recipe).toBeTruthy()
    expect(body.recipe.id).toBeTruthy()
    expect(body.recipe.title).toBe(title)
    expect(body.recipe.status).toBe('published')

    // 정리
    await deleteTestRecipe(body.recipe.id)
  })

  test('POST /api/recipes: 미인증 시 401', async ({ page }) => {
    // authenticatedPage 대신 일반 page — 쿠키 없음
    const response = await page.request.post('/api/recipes', {
      data: {
        title: 'unauthenticated',
        description: 'test',
      },
    })
    expect(response.status()).toBe(401)
  })

  test('생성된 published 레시피가 /recipes 목록에 노출', async ({ authenticatedPage: page }) => {
    const title = `E2E Visible ${Date.now()}`
    const createRes = await page.request.post('/api/recipes', {
      data: {
        title,
        description: 'visibility test',
        cuisine_type: 'other',
        dish_type: 'other',
        difficulty_level: 'easy',
        servings: 1,
        prep_time_minutes: 1,
        cook_time_minutes: 1,
        status: 'published',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const { recipe } = await createRes.json()

    try {
      // 목록에서 검색 — 최신순이므로 첫 페이지에 있어야 함
      await page.goto('/recipes', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
      // 클릭 가능한 링크로 존재해야 함
      const link = page.locator(`a[href="/recipes/${recipe.id}"]`).first()
      await expect(link).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteTestRecipe(recipe.id)
    }
  })
})
