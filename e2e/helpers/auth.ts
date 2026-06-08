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

  // 기존 유저 확인 — profiles 테이블로 조회 (listUsers API가 dev 프로젝트에서 불안정)
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let userId: string
  if (existingProfile?.id) {
    userId = existingProfile.id
    // 비밀번호를 매번 재설정해 이전 테스트의 side effect 차단
    await admin.auth.admin.updateUserById(userId, { password })
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
  // auth admin API가 dev 프로젝트에서 불안정 — SQL RPC로 fallback
  const { error: apiError } = await admin.auth.admin.deleteUser(userId)
  if (apiError) {
    const { error: rpcError } = await admin.rpc('delete_auth_user', { user_id: userId })
    if (rpcError) throw new Error(`deleteUser failed: ${rpcError.message}`)
  }
}

/**
 * 테스트 유저의 role 을 변경(service-role). 어드민 페이지 e2e 용.
 * ⚠️ testUser 는 worker 공유이므로 admin 승격 후 반드시 'user' 로 원복할 것.
 */
export async function setUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  const admin = adminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(`setUserRole failed: ${error.message}`)
}

export interface CreateTestRecipeOptions {
  title?: string
  status?: 'published' | 'draft'
  /** 기본 3단계 스텝 추가 (timer_minutes 없음) */
  withSteps?: boolean
  /** withSteps 대신 timer_minutes가 포함된 스텝을 추가 (타이머 테스트용) */
  withTimerStep?: boolean
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

  if (opts.withTimerStep) {
    // 1분 타이머가 붙은 단일 스텝 — page.clock으로 시간 가속해 타이머 완료를 테스트
    await admin.from('recipe_steps').insert([
      { recipe_id: recipe.id, step_number: 1, instruction: '1분간 끓인다.', timer_minutes: 1 },
    ])
  } else if (opts.withSteps) {
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
