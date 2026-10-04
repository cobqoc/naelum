import { createServiceClient } from '@/lib/supabase/service'
import { getClientIp } from '@/lib/api/clientIp'
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
    const ip = getClientIp(request.headers)

    const { allowed } = await checkRateLimit(`find-email:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    })

    if (!allowed) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문·문자열 아닌 username 은 throw/TypeError → catch 500 이었다 → 기존 400 문구.
    const body = await request.json().catch(() => undefined)
    const username = body && typeof body === 'object' ? body.username : undefined

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
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
