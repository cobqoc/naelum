import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// POST /api/push-tokens — FCM/APNs 토큰 upsert (KMP 모바일 앱 전용)
// 쿠키 세션으로 사용자 확인 후 push_tokens 테이블에 (user_id, platform) 기준 upsert.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  let body: { token?: string; platform?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  const { token, platform } = body
  if (!token || !platform) {
    return NextResponse.json({ error: 'token과 platform은 필수입니다.' }, { status: 400 })
  }
  if (platform !== 'android' && platform !== 'ios') {
    return NextResponse.json({ error: 'platform은 android 또는 ios여야 합니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user!.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,platform' }
    )

  if (error) {
    console.error('[push-tokens] upsert error:', error)
    return NextResponse.json({ error: '토큰 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
