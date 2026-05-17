import type { Page } from '@playwright/test'
import { test, expect } from './auth-fixtures'
import { deleteTestRecipe } from './helpers/auth'

// /recipes/new 는 루트 'use client' + useSearchParams() 라 진입 시
// app/loading.tsx("로딩 중", .animate-bounce) Suspense fallback 이 먼저 뜬다.
// networkidle 만으로는 splash 위에서 끝날 수 있어, splash 가 사라질 때까지
// 명시적으로 대기한다 (search.spec.ts 와 동일한 검증된 패턴).
async function gotoRecipeNew(page: Page) {
  await page.goto('/recipes/new', { waitUntil: 'domcontentloaded' })
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {})
}

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

    await page.goto('/recipes/new', { waitUntil: 'networkidle' })

    // 제목 input이 있어야 함 (Suspense loading 이후 렌더)
    const titleInput = page.locator('input[placeholder*="떡볶이"], input[placeholder*="만드는건"]').first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })

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
      const link = page.locator(`a[href*="/recipes/${recipe.id}"]`).first()
      await expect(link).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteTestRecipe(recipe.id)
    }
  })

  /**
   * 분해(god-file → 섹션 컴포넌트 / TagsField 추출) 회귀 안전망.
   * 1587줄 NewRecipePage 를 섹션 컴포넌트로 추출할 때 가장 깨지기 쉬운 것:
   *  (1) 동적 추가 버튼 핸들러 wiring (addStep / addIngredients)
   *  (2) controlled input ↔ state 바인딩
   *  (3) copyright 동의 게이트 → 제출 버튼 활성화
   *  (4) 추출된 TagsField 의 태그 추가/삭제
   *
   * /recipes/new 는 루트 'use client' + useSearchParams() 라 app/loading.tsx
   * ("로딩 중", .animate-bounce) Suspense fallback 뒤에서 하이드레이션된다.
   * cold-start 단발 실행에서는 splash 가 느리게 걷힐 수 있어 gotoRecipeNew()
   * 가 splash 소멸을 명시적으로 대기한다(검증된 패턴). 같은 디렉토리의 기존
   * '폼 렌더' 테스트가 warm 전체 스위트에서 정상 통과함을 확인했다.
   */
  test('UI 회귀: 단계/재료/태그 동적 추가 + 입력 바인딩 + 에러 없음', async ({ authenticatedPage: page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await gotoRecipeNew(page)

    // (2) 제목 controlled input 바인딩
    const titleInput = page.locator('input[placeholder*="떡볶이"]').first()
    await expect(titleInput).toBeVisible({ timeout: 15000 })
    await titleInput.fill('분해 회귀 테스트 레시피')
    await expect(titleInput).toHaveValue('분해 회귀 테스트 레시피')

    // (1) 단계 추가 핸들러 — 단계 instruction textarea 개수 증가
    const stepBoxes = page.locator('textarea[placeholder*="조리 방법을 단계별로"]')
    const stepsBefore = await stepBoxes.count()
    await page.getByRole('button', { name: '+ 단계 추가' }).click()
    await expect(async () => {
      expect(await stepBoxes.count()).toBe(stepsBefore + 1)
    }).toPass({ timeout: 5000 })

    // 새 단계 textarea 에 입력 → 바인딩 확인
    const lastStep = stepBoxes.last()
    await lastStep.fill('새 단계 설명')
    await expect(lastStep).toHaveValue('새 단계 설명')

    // (1) 재료 5개 추가 핸들러 — 재료 준비 섹션 input 개수 증가
    const ingSection = page.locator('section').filter({ hasText: '재료 준비' })
    const ingBefore = await ingSection.locator('input').count()
    await page.getByRole('button', { name: '+ 재료 5개 추가' }).click()
    await expect(async () => {
      expect(await ingSection.locator('input').count()).toBeGreaterThan(ingBefore)
    }).toPass({ timeout: 5000 })

    // 추출된 TagsField 회귀: 태그 추가 → 칩 노출 → 삭제 → 사라짐
    const tagInput = page.getByPlaceholder('태그 입력 후 추가 버튼 클릭')
    await tagInput.fill('E2E태그')
    await page
      .locator('div')
      .filter({ has: page.getByPlaceholder('태그 입력 후 추가 버튼 클릭') })
      .getByRole('button', { name: '추가', exact: true })
      .first()
      .click()
    const chip = page.locator('span', { hasText: '#E2E태그' })
    await expect(chip).toBeVisible()
    await chip.getByRole('button', { name: '×' }).click()
    await expect(chip).toHaveCount(0)

    // (3) copyright 게이트: 미동의 시 제출 비활성 → 동의 시 활성
    const submitBtn = page.getByRole('button', { name: /레시피 등록하기/ })
    await expect(submitBtn).toBeDisabled()
    const copyright = page.locator('input[type="checkbox"]').last()
    await copyright.check()
    await expect(submitBtn).toBeEnabled()

    // 임시저장 버튼 wiring (RecipeFormFooter 추출 회귀 가드) — copyright 무관 항상 활성
    const draftBtn = page.getByRole('button', { name: '임시저장', exact: true })
    await expect(draftBtn).toBeVisible()
    await expect(draftBtn).toBeEnabled()

    // 전 과정에서 런타임 에러 없어야 (분해 시 stale closure / prop 누락 조기 탐지)
    expect(pageErrors).toEqual([])
  })

  /**
   * 분해 회귀 안전망 — Section 1(기본 정보) 갭 보강.
   * 기존 'UI 회귀' 테스트가 제목·단계·재료·태그·copyright 는 커버하나,
   * BasicInfoSection 추출 시 깨지기 쉬운 다음을 커버하지 못해 갭 보강:
   *  - description textarea ↔ state 바인딩
   *  - servings number input ↔ state 바인딩
   *  - difficulty select ↔ state 바인딩
   *  - cuisine 버튼 선택 → '기타' 시 커스텀 입력 조건부 노출 + 바인딩
   *  - cuisine 선택 후 dish type 섹션 조건부 노출
   * 추출 전 미수정 코드에서 green(baseline) 확인 → 추출 후 동일 green.
   */
  test('UI 회귀(Section1 기본정보): 설명·인분·난이도·요리종류 바인딩 + 조건부 토글', async ({ authenticatedPage: page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await gotoRecipeNew(page)

    // description textarea 바인딩
    const desc = page.locator('textarea[placeholder*="간단한 설명"]').first()
    await expect(desc).toBeVisible({ timeout: 15000 })
    await desc.fill('분해 회귀 설명 텍스트')
    await expect(desc).toHaveValue('분해 회귀 설명 텍스트')

    // servings — Section1 첫 number input
    const servings = page.locator('input[type="number"]').first()
    await servings.fill('3')
    await expect(servings).toHaveValue('3')

    // difficulty select — '선택안함' 옵션을 가진 select
    const difficulty = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: '선택안함' }) })
      .first()
    await difficulty.selectOption({ index: 1 })
    await expect(difficulty).not.toHaveValue('')

    // cuisine '기타' 선택 → 커스텀 입력 조건부 노출 + 바인딩
    await page.getByRole('button', { name: '기타', exact: true }).first().click()
    const customCuisine = page.locator('input[placeholder*="요리 종류를 입력"]')
    await expect(customCuisine).toBeVisible({ timeout: 5000 })
    await customCuisine.fill('퓨전')
    await expect(customCuisine).toHaveValue('퓨전')

    // cuisine 선택 후 dish type 섹션(요리 유형) 조건부 노출
    await expect(page.getByText('요리 유형').first()).toBeVisible({ timeout: 5000 })

    expect(pageErrors).toEqual([])
  })
})
