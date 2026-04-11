import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateUsername } from '@/lib/utils/usernameValidator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  // 종합 검증 (형식, 욕설, 예약어)
  const validation = validateUsername(username)
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      error: validation.error
    })
  }

  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 중복 체크
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  // 본인의 현재 닉네임인 경우 사용 가능
  if (existingProfile && user && existingProfile.id === user.id) {
    return NextResponse.json({ available: true })
  }

  return NextResponse.json({
    available: !existingProfile,
    error: existingProfile ? '이미 사용 중인 닉네임입니다.' : null
  })
}
