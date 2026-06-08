import { test, expect } from './auth-fixtures'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// PUT /api/users/me/preferences 회귀 안전망.
// 병목 개선(3 테이블 delete→insert 6 직렬 round-trip → 병렬화) *전에* 동작을 잠근다:
//   - 관심사·식단·알레르기 3종이 모두 DB 에 저장됨
//   - replace 시맨틱(delete→insert): 재저장 시 이전 값 사라지고 새 값만 남음
// 이 경로는 기존 e2e 미커버라 병렬화 전 net 선작성(미수정 코드에서 green 이어야 함).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function clearPrefs(uid: string) {
  const a = admin()
  await a.from('user_interests').delete().eq('user_id', uid)
  await a.from('user_dietary_preferences').delete().eq('user_id', uid)
  await a.from('user_allergies').delete().eq('user_id', uid)
}

async function readPrefs(uid: string) {
  const a = admin()
  const { data: i } = await a.from('user_interests').select('interest_value').eq('user_id', uid)
  const { data: d } = await a.from('user_dietary_preferences').select('preference_type').eq('user_id', uid)
  const { data: al } = await a.from('user_allergies').select('ingredient_name').eq('user_id', uid)
  return {
    interests: (i ?? []).map(x => x.interest_value).sort(),
    dietary: (d ?? []).map(x => x.preference_type).sort(),
    allergies: (al ?? []).map(x => x.ingredient_name).sort(),
  }
}

test.describe('선호도 저장 — PUT /api/users/me/preferences 안전망', () => {
  test('3종 저장 + replace 시맨틱이 DB 에 반영된다', async ({ authenticatedPage: page, testUser }) => {
    await clearPrefs(testUser.userId)
    try {
      // 1차 저장
      const res1 = await page.request.put('/api/users/me/preferences', {
        data: { interests: ['korean', 'japanese'], dietaryPreferences: ['vegan'], allergies: ['땅콩', '우유'] },
      })
      expect(res1.ok()).toBeTruthy()

      await expect.poll(() => readPrefs(testUser.userId), { timeout: 10000, intervals: [400, 800, 1200] })
        .toEqual({ interests: ['japanese', 'korean'], dietary: ['vegan'], allergies: ['땅콩', '우유'] })

      // 2차 저장 — delete→insert replace: 이전 값 사라지고 새 값만
      const res2 = await page.request.put('/api/users/me/preferences', {
        data: { interests: ['chinese'], dietaryPreferences: [], allergies: [] },
      })
      expect(res2.ok()).toBeTruthy()

      await expect.poll(() => readPrefs(testUser.userId), { timeout: 10000, intervals: [400, 800, 1200] })
        .toEqual({ interests: ['chinese'], dietary: [], allergies: [] })
    } finally {
      await clearPrefs(testUser.userId)
    }
  })
})
