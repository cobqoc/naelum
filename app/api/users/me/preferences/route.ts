import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { INTEREST_TYPE_CUISINE } from '@/lib/constants/userPreferences'

// PUT /api/users/me/preferences — 관심사·식단·알레르기 저장
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await requireAuth(supabase)
    if (authError) return authError

    const body = await request.json()
    const {
      interests = [],
      dietaryPreferences = [],
      allergies = [],
    }: { interests: string[]; dietaryPreferences: string[]; allergies: string[] } = body

    const uid = user!.id

    // 각 카테고리 delete→insert. Supabase 는 RLS 거부 시 throw 안 하고 { error }
    // 반환 → delete 성공 후 insert 실패 시 선호 *전량 유실*인데 {ok:true} 였다(최악).
    // 모든 write 의 .error 를 명시 체크해 실패를 표면화한다(CLAUDE.md 규율).
    const { error: e1 } = await supabase.from('user_interests').delete().eq('user_id', uid)
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
    if (interests.length > 0) {
      const { error } = await supabase.from('user_interests').insert(
        interests.map((v: string) => ({ user_id: uid, interest_type: INTEREST_TYPE_CUISINE, interest_value: v }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: e2 } = await supabase.from('user_dietary_preferences').delete().eq('user_id', uid)
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    if (dietaryPreferences.length > 0) {
      const { error } = await supabase.from('user_dietary_preferences').insert(
        dietaryPreferences.map((v: string) => ({ user_id: uid, preference_type: v, is_active: true }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: e3 } = await supabase.from('user_allergies').delete().eq('user_id', uid)
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 })
    if (allergies.length > 0) {
      const { error } = await supabase.from('user_allergies').insert(
        allergies.map((v: string) => ({ user_id: uid, ingredient_name: v, severity: 'moderate' }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, interests, dietaryPreferences, allergies })
  } catch (error) {
    console.error('[users/me/preferences] PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
