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

    // 2026-10-04 API1-41: 형식 오류 JSON·객체 아닌 본문·배열 아닌 필드는 아래에서 throw → catch → 500 이었고,
    // 배열 아님(`interests: "abc"`)은 그 테이블을 *delete 한 뒤* .map TypeError 로 실패해 선호가 지워졌다
    // → 쓰기 전에 400. 정상(배열) 입력은 그대로.
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }
    const {
      interests = [],
      dietaryPreferences = [],
      allergies = [],
    }: { interests: string[]; dietaryPreferences: string[]; allergies: string[] } = body as {
      interests: string[]; dietaryPreferences: string[]; allergies: string[]
    }
    if (![interests, dietaryPreferences, allergies].every(Array.isArray)) {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }

    const uid = user!.id

    // 각 카테고리 delete→insert. Supabase 는 RLS 거부 시 throw 안 하고 { error }
    // 반환 → delete 성공 후 insert 실패 시 선호 *전량 유실*인데 {ok:true} 였다(최악).
    // 모든 write 의 .error 를 명시 체크해 실패를 표면화한다(CLAUDE.md 규율).
    // 병목 개선: 3 테이블 독립이라 [delete→insert] 체인을 병렬(6 직렬 round-trip → ~2단).
    // 체인 *내부*는 순서 유지(delete 먼저). 하나라도 실패하면 첫 에러로 500.
    const errs = (await Promise.all([
      (async (): Promise<string | null> => {
        const { error: dErr } = await supabase.from('user_interests').delete().eq('user_id', uid)
        if (dErr) return dErr.message
        if (interests.length > 0) {
          const { error } = await supabase.from('user_interests').insert(
            interests.map((v: string) => ({ user_id: uid, interest_type: INTEREST_TYPE_CUISINE, interest_value: v }))
          )
          if (error) return error.message
        }
        return null
      })(),
      (async (): Promise<string | null> => {
        const { error: dErr } = await supabase.from('user_dietary_preferences').delete().eq('user_id', uid)
        if (dErr) return dErr.message
        if (dietaryPreferences.length > 0) {
          const { error } = await supabase.from('user_dietary_preferences').insert(
            dietaryPreferences.map((v: string) => ({ user_id: uid, preference_type: v, is_active: true }))
          )
          if (error) return error.message
        }
        return null
      })(),
      (async (): Promise<string | null> => {
        const { error: dErr } = await supabase.from('user_allergies').delete().eq('user_id', uid)
        if (dErr) return dErr.message
        if (allergies.length > 0) {
          const { error } = await supabase.from('user_allergies').insert(
            allergies.map((v: string) => ({ user_id: uid, ingredient_name: v, severity: 'moderate' }))
          )
          if (error) return error.message
        }
        return null
      })(),
    ])).filter(Boolean)
    if (errs.length > 0) return NextResponse.json({ error: errs[0] }, { status: 500 })

    return NextResponse.json({ ok: true, interests, dietaryPreferences, allergies })
  } catch (error) {
    console.error('[users/me/preferences] PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
