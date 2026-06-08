import { test, expect } from './auth-fixtures'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { deleteTestRecipe } from './helpers/auth'

// GET /api/search 의 냉장고 match 부착 회귀 안전망.
// 병목 개선: search 가 recipes/ingredients 두 결과에 attachFridgeMatch 를 *2번* 호출(중복
// user_ingredients read). 이를 union 1회 호출로 합치기 *전에*, "로그인 + 냉장고 보유 시
// 검색결과 레시피에 fridge-match 필드가 부착된다" 불변식을 잠근다(미수정 코드에서 green).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.describe('검색 냉장고 match 부착 — 데이터 계층 안전망', () => {
  test('로그인 + 냉장고 보유 → 검색결과 레시피에 fridge-match 필드 부착', async ({ authenticatedPage: page, testUser }) => {
    const a = admin()
    await a.from('user_ingredients').delete().eq('user_id', testUser.userId).eq('ingredient_name', '양파')
    await a.from('user_ingredients').insert({ user_id: testUser.userId, ingredient_name: '양파', category: 'veggie' })

    const title = `E2E FridgeMatch ${Date.now()}`
    const createRes = await page.request.post('/api/recipes', {
      data: {
        title, status: 'published', cuisine_type: 'other', dish_type: 'other',
        difficulty_level: 'easy', servings: 1, prep_time_minutes: 1, cook_time_minutes: 1,
        ingredients: [{ ingredient_name: '양파', quantity: 1, unit: '개' }],
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const { recipe } = await createRes.json()

    try {
      const res = await page.request.get(`/api/search?q=${encodeURIComponent(title)}&type=all`)
      expect(res.ok()).toBeTruthy()
      const { results } = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = (results.recipes?.data ?? []).find((r: any) => r.id === recipe.id)
      expect(found).toBeTruthy()
      // 냉장고 보유 사용자라 attachFridgeMatch 가 match 필드를 부착해야 함
      expect(found).toHaveProperty('matchRate')
      expect(found).toHaveProperty('ownedCount')
      expect(found).toHaveProperty('ingredientStatus')
    } finally {
      await deleteTestRecipe(recipe.id)
      await a.from('user_ingredients').delete().eq('user_id', testUser.userId).eq('ingredient_name', '양파')
    }
  })
})
