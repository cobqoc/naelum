import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const TEST_USER_EMAIL_PREFIX = 'playwright-w'
export const TEST_USER_PASSWORD = 'PlaywrightTest!2026'
export const TEST_USER_EMAIL_DOMAIN = '@naelum.local'

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'e2e/helpers/auth: NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다. playwright.config.ts가 .env.local을 로드하는지 확인하세요.'
    )
  }
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface TestUser {
  userId: string
  email: string
  password: string
  username: string
}

/**
 * 테스트 유저를 생성하거나 기존 유저를 재사용한다.
 * 프로필은 onboarding_completed=true로 설정해 미들웨어 terms-agreement 리다이렉트를 우회한다.
 */
export async function ensureTestUser(
  email: string,
  password: string = TEST_USER_PASSWORD
): Promise<TestUser> {
  const admin = adminClient()

  // 기존 유저 확인 — listUsers는 페이징이라 수천 명 환경에선 비효율이지만 테스트용이라 OK
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = list?.users.find(u => u.email === email)

  let userId: string
  if (existing) {
    userId = existing.id
    // 비밀번호를 매번 재설정해 이전 테스트의 side effect 차단
    await admin.auth.admin.updateUserById(existing.id, { password })
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) {
      throw new Error(`createUser failed: ${error?.message}`)
    }
    userId = data.user.id
  }

  // 프로필 온보딩 완료 상태로 업데이트 (trigger가 생성한 행을 UPDATE)
  const username = `pwtest_${userId.slice(0, 8)}`
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_step: 4,
      username,
      auth_provider: 'email',
    })
    .eq('id', userId)

  if (profileError) {
    throw new Error(`profile update failed: ${profileError.message}`)
  }

  return { userId, email, password, username }
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient()
  await admin.auth.admin.deleteUser(userId)
}

export interface CreateTestRecipeOptions {
  title?: string
  status?: 'published' | 'draft'
  withSteps?: boolean
}

export async function createTestRecipe(
  authorId: string,
  opts: CreateTestRecipeOptions = {}
): Promise<string> {
  const admin = adminClient()

  const { data: recipe, error } = await admin
    .from('recipes')
    .insert({
      author_id: authorId,
      title: opts.title ?? 'Playwright Test Recipe',
      description: 'E2E 테스트용 자동 생성 레시피',
      status: opts.status ?? 'published',
      cuisine_type: 'other',
      dish_type: 'other',
      difficulty_level: 'easy',
      servings: 2,
      prep_time_minutes: 5,
      cook_time_minutes: 10,
    })
    .select('id')
    .single()

  if (error || !recipe) {
    throw new Error(`createTestRecipe failed: ${error?.message}`)
  }

  if (opts.withSteps) {
    await admin.from('recipe_steps').insert([
      { recipe_id: recipe.id, step_number: 1, instruction: '재료를 준비한다.' },
      { recipe_id: recipe.id, step_number: 2, instruction: '볶는다.' },
      { recipe_id: recipe.id, step_number: 3, instruction: '완성.' },
    ])
  }

  return recipe.id as string
}

export async function deleteTestRecipe(recipeId: string): Promise<void> {
  const admin = adminClient()
  await admin.from('recipes').delete().eq('id', recipeId)
}
