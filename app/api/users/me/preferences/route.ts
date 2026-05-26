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

    await supabase.from('user_interests').delete().eq('user_id', uid)
    if (interests.length > 0) {
      await supabase.from('user_interests').insert(
        interests.map((v: string) => ({ user_id: uid, interest_type: INTEREST_TYPE_CUISINE, interest_value: v }))
      )
    }

    await supabase.from('user_dietary_preferences').delete().eq('user_id', uid)
    if (dietaryPreferences.length > 0) {
      await supabase.from('user_dietary_preferences').insert(
        dietaryPreferences.map((v: string) => ({ user_id: uid, preference_type: v, is_active: true }))
      )
    }

    await supabase.from('user_allergies').delete().eq('user_id', uid)
    if (allergies.length > 0) {
      await supabase.from('user_allergies').insert(
        allergies.map((v: string) => ({ user_id: uid, ingredient_name: v, severity: 'moderate' }))
      )
    }

    return NextResponse.json({ ok: true, interests, dietaryPreferences, allergies })
  } catch (error) {
    console.error('[users/me/preferences] PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
