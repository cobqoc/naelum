import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// GET /api/users/me — 현재 로그인 사용자 프로필 조회 (쿠키 인증)
export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await requireAuth(supabase)
    if (authError) return authError

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, recipes_count')
      .eq('id', user!.id)
      .maybeSingle()

    if (error || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[users/me] GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
