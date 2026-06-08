import type { Page } from '@playwright/test'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { test, expect } from './auth-fixtures'

// 시드는 실제 유저 경로(POST /api/recipes, 인증 쿠키)로 생성 — recipe-edit.spec 와 동일 근거.
// cleanup 만 service-role.

/**
 * 레시피 리믹스(`/recipes/new?remix=<id>`) 폼 prefill 회귀 안전망.
 *
 * 데이터 계층 이전(docs/DATA_LAYER.md) 대상: new 페이지의 remix useEffect 가 원본
 * recipe + ingredients + steps 를 직접 supabase read(3곳)로 로드해 폼에 채운다.
 * 이 read 를 GET /api/recipes/[id] 재사용으로 *바꾸기 전에* 불변식을 잠근다 —
 * 미수정 코드에서 먼저 green(baseline) 이어야 한다.
 *
 *  (1) 원본 → 폼 prefill: 제목 `리믹스: {원본}`·재료명·단계 설명 + remix 배너("원본:")
 *
 * /recipes/new 는 'use client' + useSearchParams → app/loading.tsx(.animate-bounce)
 * Suspense fallback 이 먼저. recipe-edit/creation.spec 의 splash-wait 패턴 재사용.
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
  stepInstruction: string
  ingredientName: string
}

/** 재료·단계가 채워진 published 레시피를 실제 유저 경로(POST /api/recipes)로 시드. */
async function seedRemixSource(page: Page): Promise<SeededRecipe> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000)
  const title = `E2E Remix 원본제목 ${stamp}`
  const stepInstruction = `원본 단계 설명 ${stamp}`
  const ingredientName = `양파테스트${stamp}`

  const res = await page.request.post('/api/recipes', {
    data: {
      title,
      description: '리믹스 안전망 시드',
      status: 'published',
      cuisine_type: 'other',
      dish_type: 'other',
      difficulty_level: 'easy',
      servings: 2,
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      ingredients: [{ ingredient_name: ingredientName, quantity: 1, unit: '개', notes: '', is_optional: false }],
      steps: [{ instruction: stepInstruction }],
      tags: [],
    },
  })
  if (res.status() !== 201) {
    throw new Error(`seedRemixSource POST failed (${res.status()}): ${await res.text()}`)
  }
  const { recipe } = await res.json()
  return { recipeId: recipe.id as string, title, stepInstruction, ingredientName }
}

async function cleanup(recipeId: string) {
  await admin().from('recipes').delete().eq('id', recipeId)
}

async function gotoRecipeRemix(page: Page, recipeId: string) {
  await page.goto(`/recipes/new?remix=${recipeId}`, { waitUntil: 'domcontentloaded' })
  await page
    .waitForFunction(() => !document.querySelector('.animate-bounce'), { timeout: 30000 })
    .catch(() => {})
}

test.describe('레시피 리믹스 — 폼 prefill 회귀 안전망', () => {
  test('(1) 원본 레시피가 새 폼에 prefill 된다 (제목·재료·단계 + 원본 배너)', async ({
    authenticatedPage: page,
  }) => {
    const seed = await seedRemixSource(page)
    try {
      const pageErrors: string[] = []
      page.on('pageerror', (e) => pageErrors.push(e.message))

      await gotoRecipeRemix(page, seed.recipeId)

      // 제목 input 이 `리믹스: {원본제목}` 으로 prefill
      const titleInput = page
        .locator('input[placeholder*="떡볶이"], input[placeholder*="만드는건"]')
        .first()
      await expect(titleInput).toBeVisible({ timeout: 15000 })
      await expect(titleInput).toHaveValue(`리믹스: ${seed.title}`)

      // remix 배너 — "원본:" + 원본 제목 링크
      await expect(page.getByText('원본:')).toBeVisible()
      await expect(page.getByRole('link', { name: seed.title })).toBeVisible()

      // 재료명 로드 (1행 name input placeholder = getPlaceholderName1 "예: 돼지고기")
      await expect(
        page.locator('input[placeholder*="돼지고기"]').first()
      ).toHaveValue(seed.ingredientName)

      // 단계 설명 textarea 로드 (new StepsSection — 단계 "제목" input 은 없음)
      await expect(
        page.locator('textarea[placeholder*="조리 방법을 단계별로"]').first()
      ).toHaveValue(seed.stepInstruction)

      expect(pageErrors).toEqual([])
    } finally {
      await cleanup(seed.recipeId)
    }
  })
})
