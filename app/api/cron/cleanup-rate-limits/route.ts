import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/service'
import { isAuthorizedCronRequest } from '@/lib/api/cron'

export async function GET(request: NextRequest) {
  // CRON_SECRET 미설정이면 거부(2026-10-04 AG2-16: 이전엔 "Bearer undefined" 통과)
  if (!isAuthorizedCronRequest(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2026-10-04 AG2-29/API1-40: 인라인 사본 → 공용 service-role 클라이언트(같은 인자).
  const supabase = getServiceRoleClient()

  const { error } = await supabase.rpc('cleanup_rate_limits')

  if (error) {
    console.error('[cron] cleanup_rate_limits error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
