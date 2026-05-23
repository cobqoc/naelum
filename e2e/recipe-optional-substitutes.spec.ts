import { test, expect } from './auth-fixtures'
import { deleteTestRecipe } from './helpers/auth'

/**
 * "없어도 OK" 토글 + 대체 재료 입력 회귀 안전망 (2026-05-23).
 *
 * 검증 목표:
 *  (1) /recipes/new 작성 폼에 토글·대체 입력 노출
 *  (2) POST /api/recipes 가 is_optional·substitutes 받아 저장 (round-trip)
 *  (3) GET /api/recipes/[id] 응답에 동일 값 포함
 *  (4) 비-admin 유저는 /api/admin/substitute-suggestions GET 차단(403)
 *
 * UI 의 실제 토글 클릭/입력 후 폼 제출까지 보는 e2e 는 god-file 비용 큼 →
 * vitest match.test.ts 가 매칭 로직, 본 spec 은 API 라운드트립만 가드.
 */
test.describe('레시피 선택 재료·대체 재료', () => {
  test('인증 유저: 작성 폼에 "선택 재료" 토글 + 대체 재료 입력 노출', async ({ authenticatedPage: page }) => {
    await page.goto('/recipes/new', { waitUntil: 'domcontentloaded' })
    await page
      .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
      .catch(() => {})

    // "선택 재료" 토글 라벨이 최소 1행 보임 (2026-05-23 카드 레이아웃: row1 인라인 토글)
    // 풀라벨 "없어도 OK" 는 title attribute 로만 노출, visible label = ingOptionalShort
    const optionalLabel = page.getByText(/선택 재료/).first()
    await expect(optionalLabel).toBeVisible({ timeout: 10000 })

    // 대체 재료 입력 placeholder (chip UI 빈 상태 placeholder = "대체 재료 추가...")
    const substituteInput = page.getByPlaceholder(/대체 재료/).first()
    await expect(substituteInput).toBeVisible()
  })

  test('POST /api/recipes: is_optional + substitutes 라운드트립', async ({ authenticatedPage: page }) => {
    const title = `E2E Optional ${Date.now()}`
    const createRes = await page.request.post('/api/recipes', {
      data: {
        title,
        description: 'E2E 선택 재료 테스트',
        cuisine_type: 'other',
        dish_type: 'other',
        difficulty_level: 'easy',
        servings: 1,
        prep_time_minutes: 1,
        cook_time_minutes: 1,
        status: 'published',
        ingredients: [
          { ingredient_name: '양파', quantity: 1, unit: '개', is_optional: false, substitutes: [] },
          {
            ingredient_name: '청양고추',
            quantity: 1,
            unit: '개',
            is_optional: true,
            substitutes: ['페페론치노', '풋고추'],
          },
        ],
        steps: [{ instruction: '볶는다' }],
      },
    })
    expect(createRes.status()).toBe(201)
    const { recipe } = await createRes.json()
    expect(recipe.id).toBeTruthy()

    try {
      // GET /api/recipes/[id] 라운드트립 확인
      const getRes = await page.request.get(`/api/recipes/${recipe.id}`)
      expect(getRes.ok()).toBeTruthy()
      const body = await getRes.json()
      const ingredients = body.recipe.ingredients as Array<{
        ingredient_name: string
        is_optional: boolean
        substitutes: string[] | null
      }>

      const cheongyang = ingredients.find(i => i.ingredient_name === '청양고추')
      expect(cheongyang).toBeTruthy()
      expect(cheongyang!.is_optional).toBe(true)
      expect(cheongyang!.substitutes).toEqual(expect.arrayContaining(['페페론치노', '풋고추']))

      const onion = ingredients.find(i => i.ingredient_name === '양파')
      expect(onion).toBeTruthy()
      expect(onion!.is_optional).toBe(false)
      // 빈 배열은 null로 정규화돼서 저장됨
      expect(onion!.substitutes == null || (Array.isArray(onion!.substitutes) && onion!.substitutes.length === 0)).toBe(true)
    } finally {
      await deleteTestRecipe(recipe.id)
    }
  })

  test('비-admin 유저: /api/admin/substitute-suggestions 차단', async ({ authenticatedPage: page }) => {
    const res = await page.request.get('/api/admin/substitute-suggestions')
    // 일반 유저는 admin role 아님 → 403
    expect([401, 403]).toContain(res.status())
  })
})
