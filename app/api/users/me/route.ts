import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { sanitizeHtml } from '@/lib/security/sanitize'

// GET /api/users/me — 현재 로그인 사용자 프로필 조회 (쿠키 인증)
export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await requireAuth(supabase)
    if (authError) return authError

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, recipes_count, show_saved_to_public, show_cooked_to_public, push_notifications, gender, birth_date, country')
      .eq('id', user!.id)
      .maybeSingle()

    if (error || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
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
      if (typeof username !== 'string' || username.length < 2 || username.length > 20) {
        return NextResponse.json({ error: '닉네임은 2~20자여야 합니다' }, { status: 400 })
      }
      if (!/^[a-z0-9_]+$/.test(username)) {
        return NextResponse.json({ error: '닉네임은 영문 소문자, 숫자, _만 사용 가능합니다' }, { status: 400 })
      }
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user!.id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다' }, { status: 409 })
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user!.id)
      .select('id, username, full_name, avatar_url, bio, recipes_count, show_saved_to_public, show_cooked_to_public, push_notifications, gender, birth_date, country')
      .single()

    if (error) {
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
