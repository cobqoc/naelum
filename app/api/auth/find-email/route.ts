import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length <= 2
    ? local[0] + '***'
    : local.slice(0, 2) + '***'
  return `${maskedLocal}@${domain}`
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || username.trim().length < 2) {
      return NextResponse.json({ error: '사용자명을 입력해주세요 (2자 이상)' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .maybeSingle()

    if (!profile || !profile.email) {
      return NextResponse.json({ error: '해당 사용자명으로 등록된 계정을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      maskedEmail: maskEmail(profile.email),
      found: true
    })
  } catch (error) {
    console.error('[auth/find-email] POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
