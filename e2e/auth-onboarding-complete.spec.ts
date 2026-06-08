import { test, expect } from './auth-fixtures'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 약관 동의(terms-agreement) 완료 플로우 회귀 안전망.
// 데이터 계층 이전(docs/DATA_LAYER.md): 이 페이지는 profile 존재확인 read + createProfile/
// beginOnboarding mutation 을 클라에서 직접 한다. 이를 POST /api/auth/complete-onboarding 으로
// 통째 서버화하기 *전에* "폼 제출 → DB 에 동의기록·생년월일 반영" 불변식을 잠근다.
// 미수정 코드에서 먼저 green(baseline) 이어야 한다.
//
// testUser 프로필은 이미 존재 → beginOnboarding(update) 경로. onboarding_completed=false 로
// 잠시 전환해 약관 폼이 뜨게 하고, finally 에서 true 로 원복(공유 유저).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.describe('약관 동의 완료 → DB 반영 — 데이터 계층 이전 안전망', () => {
  test('폼 제출 → 동의기록·생년월일이 profiles 에 반영된다', async ({ authenticatedPage: page, testUser }) => {
    const a = admin()
    // 약관 미완 상태로 전환 + 기존 동의/생년월일 제거(반영을 깨끗이 검증)
    await a.from('profiles').update({
      onboarding_completed: false,
      terms_agreed_at: null,
      privacy_agreed_at: null,
      copyright_agreed_at: null,
      birth_date: null,
    }).eq('id', testUser.userId)

    try {
      await page.goto('/ko/auth/terms-agreement', { waitUntil: 'domcontentloaded' })
      // checking 스피너(animate-spin) 끝나면 폼 렌더 → 생년월일 input 등장 대기
      const dateInput = page.locator('input[type="date"]')
      await expect(dateInput).toBeVisible({ timeout: 20000 })

      // 생년월일(만 16세+) + 전체 동의 체크
      await dateInput.fill('2000-01-01')
      await page.locator('input[type="checkbox"]').first().check()

      // 제출
      await page.getByRole('button', { name: '동의하고 시작하기' }).click()

      // DB 반영을 end-state 로 폴링(고정 sleep 금지)
      await expect
        .poll(
          async () => {
            const { data } = await a
              .from('profiles')
              .select('terms_agreed_at, privacy_agreed_at, copyright_agreed_at, birth_date')
              .eq('id', testUser.userId)
              .single()
            return {
              terms: data?.terms_agreed_at != null,
              privacy: data?.privacy_agreed_at != null,
              copyright: data?.copyright_agreed_at != null,
              birth: data?.birth_date,
            }
          },
          { timeout: 15000, intervals: [500, 1000, 1500, 2000] }
        )
        .toEqual({ terms: true, privacy: true, copyright: true, birth: '2000-01-01' })
    } finally {
      await a.from('profiles').update({ onboarding_completed: true, onboarding_step: 4 }).eq('id', testUser.userId)
    }
  })
})
