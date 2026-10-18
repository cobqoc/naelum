import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { validateUsername } from '@/lib/utils/usernameValidator'
import { usernameIlikePattern } from '@/lib/utils/usernameLookup'
import { newServiceRoleClient } from '@/lib/supabase/service'

// GET /api/users/me — 현재 로그인 사용자 프로필 조회 (쿠키 인증)
export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await requireAuth(supabase)
    if (authError) return authError

    // 병목 개선: profile 과 3 선호도 read 는 모두 user.id 만 의존(독립) → 4개를 한 Promise.all
    // 로 묶어 2단 round-trip → 1단. (profile null 체크는 결과 받은 뒤로 이동)
    const [
      { data: profile, error },
      { data: interests },
      { data: dietaryPrefs },
      { data: allergies },
    ] = await Promise.all([
      // 민감 컬럼(email·gender·birth_date·push_notifications)은 authenticated SELECT 권한 밖 → 본인 행만 service-role (AG2-18)
      newServiceRoleClient()
        .from('profiles')
        .select('id, username, email, full_name, avatar_url, bio, recipes_count, show_saved_to_public, show_cooked_to_public, push_notifications, gender, birth_date, country, created_at')
        .eq('id', user!.id)
        .maybeSingle(),
      supabase.from('user_interests').select('interest_value').eq('user_id', user!.id),
      supabase.from('user_dietary_preferences').select('preference_type').eq('user_id', user!.id),
      supabase.from('user_allergies').select('ingredient_name').eq('user_id', user!.id),
    ])

    if (error || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      profile,
      interests: interests?.map(i => i.interest_value) || [],
      dietaryPreferences: dietaryPrefs?.map(d => d.preference_type) || [],
      allergies: allergies?.map(a => a.ingredient_name) || [],
    })
  } catch (error) {
    console.error('[users/me] GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT /api/users/me — 현재 로그인 사용자 프로필 수정 (쿠키 인증)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await requireAuth(supabase)
    if (authError) return authError

    const body = await request.json()
    const { full_name, bio, username, avatar_url, show_saved_to_public, show_cooked_to_public, push_notifications, gender, birth_date, country } = body

    if (full_name !== undefined && typeof full_name === 'string' && full_name.length > 100) {
      return NextResponse.json({ error: '이름은 100자 이내여야 합니다' }, { status: 400 })
    }
    if (bio !== undefined && typeof bio === 'string' && bio.length > 500) {
      return NextResponse.json({ error: '소개는 500자 이내여야 합니다' }, { status: 400 })
    }
    if (username !== undefined) {
      // check-username 과 같은 단일 규칙(형식·욕설·예약어) — 예전엔 소문자 정규식만 봐 예약어('admin')는 통과하고
      // 한글 닉네임은 거부했다(2026-10-19 감사 API1-12). 웹 설정 화면도 이 라우트로 저장한다(PAU-52).
      if (typeof username !== 'string') {
        return NextResponse.json({ error: '닉네임은 2~20자여야 합니다', code: 'invalid_username' }, { status: 400 })
      }
      const validation = validateUsername(username)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error, code: 'invalid_username' }, { status: 400 })
      }
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', usernameIlikePattern(username))
        .neq('id', user!.id)
        .limit(1)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다', code: 'username_taken' }, { status: 409 })
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) updates.full_name = full_name ? sanitizeHtml(full_name) : null
    if (bio !== undefined) updates.bio = bio ? sanitizeHtml(bio) : null
    if (username !== undefined) updates.username = username
    if (avatar_url !== undefined) updates.avatar_url = typeof avatar_url === 'string' ? avatar_url : null
    if (show_saved_to_public !== undefined) updates.show_saved_to_public = !!show_saved_to_public
    if (show_cooked_to_public !== undefined) updates.show_cooked_to_public = !!show_cooked_to_public
    if (push_notifications !== undefined) updates.push_notifications = !!push_notifications
    if (gender !== undefined) updates.gender = typeof gender === 'string' ? gender : null
    if (birth_date !== undefined) updates.birth_date = typeof birth_date === 'string' && birth_date ? birth_date : null
    if (country !== undefined) updates.country = typeof country === 'string' ? country : null

    // 갱신 결과에 민감 컬럼(gender·birth_date 등)을 돌려주므로 service-role — 필드는 위에서 화이트리스트, 행은 인증된 본인 고정 (AG2-18)
    const { data: profile, error } = await newServiceRoleClient()
      .from('profiles')
      .update(updates)
      .eq('id', user!.id)
      .select('id, username, full_name, avatar_url, bio, recipes_count, show_saved_to_public, show_cooked_to_public, push_notifications, gender, birth_date, country')
      .single()

    if (error) {
      // 동시 변경 경합 — lower(username) unique 인덱스 위반은 중복과 같은 409
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다', code: 'username_taken' }, { status: 409 })
      }
      // DB 트리거(20261019_username_rules.sql)의 형식·사칭 거부
      if (error.code === '23514') {
        return NextResponse.json({ error: '사용할 수 없는 닉네임입니다', code: 'invalid_username' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const [{ data: interests }, { data: dietaryPrefs }, { data: allergies }] = await Promise.all([
      supabase.from('user_interests').select('interest_value').eq('user_id', user!.id),
      supabase.from('user_dietary_preferences').select('preference_type').eq('user_id', user!.id),
      supabase.from('user_allergies').select('ingredient_name').eq('user_id', user!.id),
    ])

    return NextResponse.json({
      profile,
      interests: interests?.map(i => i.interest_value) || [],
      dietaryPreferences: dietaryPrefs?.map(d => d.preference_type) || [],
      allergies: allergies?.map(a => a.ingredient_name) || [],
    })
  } catch (error) {
    console.error('[users/me] PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
