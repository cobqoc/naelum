import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

// GET /api/admin/inquiries — 문의 목록 (admin)
// 데이터 계층 이전(docs/DATA_LAYER.md): admin/inquiries 의 직접 supabase read 를 서버로.
// layout 게이트 밖이라 verifyAdmin 으로 자체 admin 인증.
export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const { allowed } = await checkRateLimit(`admin-api:${ip}`, { windowMs: 10 * 60 * 1000, maxRequests: 100 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // admin RLS 정책(20260601_contact_inquiries_admin_rls)으로 전체 문의 조회.
  const { data, error } = await auth.supabase
    .from('contact_inquiries')
    .select('id, user_id, email, category, content, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inquiries: data ?? [] })
}
