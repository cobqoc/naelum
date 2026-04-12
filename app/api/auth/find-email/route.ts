import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/ratelimit'
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
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'

    const { allowed } = await checkRateLimit(`find-email:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    })

    if (!allowed) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { username } = await request.json()

    if (!username || username.trim().length < 2) {
      return NextResponse.json({ error: '사용자명을 입력해주세요 (2자 이상)' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .maybeSingle()

    type Row = { email: string } | null
    const profileRow = profile as unknown as Row

    if (!profileRow?.email) {
      return NextResponse.json({ error: '해당 사용자명으로 등록된 계정을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      maskedEmail: maskEmail(profileRow.email),
      found: true
    })
  } catch (error) {
    console.error('[auth/find-email] POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
