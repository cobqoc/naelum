import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'

    const { allowed } = await checkRateLimit(`check-email:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    })

    if (!allowed) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ provider: null })
    }

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('auth_provider')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    type Row = { auth_provider: string } | null
    return NextResponse.json({ provider: (data as unknown as Row)?.auth_provider ?? null })
  } catch (error) {
    console.error('[auth/check-email] POST error:', error)
    return NextResponse.json({ provider: null })
  }
}
