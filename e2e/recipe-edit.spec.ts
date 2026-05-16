import type { Page } from '@playwright/test'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { test, expect } from './auth-fixtures'

// 시드는 실제 유저 경로(POST /api/recipes, 인증 쿠키)로 생성한다 — service-role
// 직접 insert 는 RLS 컨텍스트가 PUT(유저 클라이언트) 과 달라 거짓 실패를 만든다.
// cleanup 만 service-role(teardown 은 RLS 무관).

/**
 * 레시피 수정 페이지(`/recipes/[id]/edit`, ~1365줄 god-file) 분해 전 회귀 안전망 (Step 0).
 *
 * ARCHITECTURE.md "Phase 2" — recipes/new 의 _components 를 그대로 재사용하려 했으나
 * 코드 정독 결과 new/edit 폼이 이미 분기됨이 확인됨. 이 spec 은 "무지성 재사용 시
 * 조용히 깨지는" 불변식을 분해 *전에* 잠근다. 미분해 코드에서 먼저 green 이어야 한다.
 *
 *  (1) 기존 레시피 데이터 → 폼 로드 (제목·재료·단계제목·단계설명·태그·영양)
 *      ↳ new StepsSection 엔 "단계 제목" input 이 없음 → 재사용 시 편집 기능 소실 가드
 *      ↳ new NutritionFields 검증 상한(5000/500)·edit 엔 없음 → show 동작 가드
 *  (2) 재료 행을 1개까지 삭제 가능 (edit 임계 `<=1`)
 *      ↳ new IngredientsSection 임계는 `<=5` → 재사용 시 편집 중 삭제 전면 불가 가드
 *  (3) 수정 제출 → PUT → DB 반영 (제목·단계제목·새 태그) + 런타임 에러 없음
 *      ↳ controlled input → state → PUT payload 전체 wiring (추출 시 stale closure/누락 가드)
 *
 * edit 페이지는 'use client' + use(params) 라 app/loading.tsx + 자체 dataLoading
 * 둘 다 `.animate-bounce` splash. recipe-creation.spec 의 검증된 splash-wait 패턴 재사용.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface SeededRecipe {
  recipeId: string
  title: string
  stepTitle: string
  stepInstruction: string
  ingredientName: string
  tag: string
}

/** 모든 섹션이 채워진 레시피를 실제 유저 경로(POST /api/recipes)로 시드.
 *  recipe-creation.spec 가 이 경로의 201+영속을 이미 검증. PUT 과 동일한
 *  유저 클라이언트/RLS 컨텍스트라 거짓 실패가 없다. */
async function seedRichRecipe(
  page: Page,
  opts: { ingredientCount?: number } = {}
): Promise<SeededRecipe> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000)
  const title = `E2E Edit 원본제목 ${stamp}`
  const stepTitle = `원본 단계 제목 ${stamp}`
  const stepInstruction = `원본 단계 설명 ${stamp}`
  const ingredientName = `양파테스트${stamp}`
  const tag = `원본태그${stamp}`

  const ingredientCount = opts.ingredientCount ?? 1
  const ingredients = Array.from({ length: ingredientCount }, (_, i) => ({
    ingredient_name: i === 0 ? ingredientName : `부재료${i}_${stamp}`,
    quantity: 1,
    unit: '개',
    notes: '',
    is_optional: false,
  }))

  const res = await page.request.post('/api/recipes', {
    data: {
      title,
      description: '분해 회귀 안전망 시드',
      status: 'published',
      cuisine_type: 'other',
      dish_type: 'other',
      difficulty_level: 'easy',
      servings: 2,
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      calories: 350,
      ingredients,
      steps: [{ title: stepTitle, instruction: stepInstruction }],
      tags: [tag],
    },
  })
  if (res.status() !== 201) {
    throw new Error(`seedRichRecipe POST failed (${res.status()}): ${await res.text()}`)
  }
  const { recipe } = await res.json()
  return { recipeId: recipe.id as string, title, stepTitle, stepInstruction, ingredientName, tag }
}

async function cleanup(recipeId: string) {
  // recipes 삭제 시 CASCADE 로 ingredients/steps/tags 동시 정리
  await admin().from('recipes').delete().eq('id', recipeId)
}

async function gotoRecipeEdit(page: Page, recipeId: string) {
  await page.goto(`/recipes/${recipeId}/edit`, { waitUntil: 'domcontentloaded' })
  // app/loading.tsx splash + 페이지 자체 dataLoading splash 둘 다 .animate-bounce.
  // 둘 다 사라질 때까지 = 폼 렌더 완료.
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {})
}

test.describe('레시피 수정 — god-file 분해 회귀 안전망', () => {
  test('(1) 기존 레시피 데이터가 폼 전 섹션에 로드된다 (단계제목·영양 포함)', async ({
    authenticatedPage: page,
  }) => {
    const seed = await seedRichRecipe(page)
    try {
      const pageErrors: string[] = []
      page.on('pageerror', (e) => pageErrors.push(e.message))

      await gotoRecipeEdit(page, seed.recipeId)

      // 제목 controlled input 에 원본 값 로드
      const titleInput = page.locator('input[placeholder*="떡볶이"]').first()
      await expect(titleInput).toBeVisible({ timeout: 15000 })
      await expect(titleInput).toHaveValue(seed.title)

      // 단계 "제목" input — new StepsSection 에는 없는 필드. 존재+값 로드 가드.
      await expect(
        page.locator('input[placeholder*="재료 손질"]').first()
      ).toHaveValue(seed.stepTitle)
      // 단계 설명 textarea
      await expect(
        page.locator('textarea[placeholder*="조리 방법을 단계별로"]').first()
      ).toHaveValue(seed.stepInstruction)

      // 재료명 로드 (1행 name input placeholder = getPlaceholderName1 "예: 돼지고기")
      await expect(
        page.locator('input[placeholder*="돼지고기"]').first()
      ).toHaveValue(seed.ingredientName)

      // 태그 칩 로드
      await expect(page.locator('span', { hasText: `#${seed.tag}` })).toBeVisible()

      // 영양 정보: calories 시드 → showNutrition 자동 true → 350 노출
      await expect(
        page.locator('input[placeholder="예: 350"]').first()
      ).toHaveValue('350')

      expect(pageErrors).toEqual([])
    } finally {
      await cleanup(seed.recipeId)
    }
  })

  test('(2) 재료 행을 1개까지 삭제할 수 있다 (edit 임계 <=1)', async ({
    authenticatedPage: page,
  }) => {
    // 재료 2개 시드 → 로드 시 정확히 2행. edit 는 <=1 일 때만 삭제 비활성.
    // (new IngredientsSection 재사용 시 <=5 라 2행에서 삭제 전면 불가 → 이 테스트가 잡음)
    const seed = await seedRichRecipe(page, { ingredientCount: 2 })
    try {
      await gotoRecipeEdit(page, seed.recipeId)
      await expect(
        page.locator('input[placeholder*="돼지고기"]').first()
      ).toHaveValue(seed.ingredientName, { timeout: 15000 })

      const ingSection = page.locator('section').filter({ hasText: '재료 준비' })
      const removeButtons = ingSection.getByRole('button', { name: '×' })

      // 시드한 2개 재료 → 삭제 버튼 2개, 활성 상태
      await expect(removeButtons).toHaveCount(2)
      await expect(removeButtons.first()).toBeEnabled()

      await removeButtons.first().click()

      // 1행으로 감소 → 마지막 1개는 비활성 (edit 의 <=1 임계 동작 고정)
      await expect(removeButtons).toHaveCount(1)
      await expect(removeButtons.first()).toBeDisabled()
    } finally {
      await cleanup(seed.recipeId)
    }
  })

  test('(3) 수정 제출 → PUT → DB 반영 (제목·단계제목·새 태그)', async ({
    authenticatedPage: page,
  }) => {
    const seed = await seedRichRecipe(page)
    try {
      const pageErrors: string[] = []
      page.on('pageerror', (e) => pageErrors.push(e.message))

      await gotoRecipeEdit(page, seed.recipeId)

      const titleInput = page.locator('input[placeholder*="떡볶이"]').first()
      await expect(titleInput).toBeVisible({ timeout: 15000 })
      await expect(titleInput).toHaveValue(seed.title)

      const newTitle = `${seed.title} [수정됨]`
      const newStepTitle = `${seed.stepTitle} [수정됨]`
      const newTag = `추가태그${Date.now()}`

      // controlled input 바인딩: 제목 수정
      await titleInput.fill(newTitle)
      await expect(titleInput).toHaveValue(newTitle)

      // 단계 제목 수정 (new 재사용 시 사라지는 필드 → wiring 가드)
      const stepTitleInput = page.locator('input[placeholder*="재료 손질"]').first()
      await expect(stepTitleInput).toHaveValue(seed.stepTitle)
      await stepTitleInput.fill(newStepTitle)
      await expect(stepTitleInput).toHaveValue(newStepTitle)

      // 태그 추가
      const tagInput = page.getByPlaceholder('태그 입력 후 추가 버튼 클릭')
      await tagInput.fill(newTag)
      await page
        .locator('div')
        .filter({ has: page.getByPlaceholder('태그 입력 후 추가 버튼 클릭') })
        .getByRole('button', { name: '추가', exact: true })
        .first()
        .click()
      await expect(page.locator('span', { hasText: `#${newTag}` })).toBeVisible()

      // 제출 → 성공 시 /recipes/{id} 로 push
      await page.getByRole('button', { name: '레시피 수정하기' }).click()
      await expect(page).toHaveURL(new RegExp(`/recipes/${seed.recipeId}(?!/edit)`), {
        timeout: 15000,
      })

      // DB 반영을 end-state 로 폴링 (고정 sleep 금지 — CLAUDE.md flaky 방지 철칙)
      await expect
        .poll(
          async () => {
            const a = admin()
            const { data: r } = await a
              .from('recipes')
              .select('title')
              .eq('id', seed.recipeId)
              .single()
            const { data: steps } = await a
              .from('recipe_steps')
              .select('title')
              .eq('recipe_id', seed.recipeId)
            const { data: tags } = await a
              .from('recipe_tags')
              .select('tag_name')
              .eq('recipe_id', seed.recipeId)
            return {
              title: r?.title,
              stepTitle: steps?.[0]?.title,
              tags: (tags ?? []).map((t) => t.tag_name).sort(),
            }
          },
          { timeout: 15000, intervals: [500, 1000, 1500, 2000] }
        )
        .toEqual({
          title: newTitle,
          stepTitle: newStepTitle,
          tags: [seed.tag, newTag].sort(),
        })

      expect(pageErrors).toEqual([])
    } finally {
      await cleanup(seed.recipeId)
    }
  })
})
