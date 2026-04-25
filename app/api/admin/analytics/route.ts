import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

// GET /api/admin/analytics - 통계 데이터 조회
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

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '7d' // 7d, 30d, 90d

  // Calculate date range
  const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[range] || 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get top recipes (선택한 기간 내 생성된 레시피 기준)
  const { data: topRecipes } = await auth.supabase
    .from('recipes')
    .select(`
      id,
      title,
      views_count,
      saves_count,
      author:profiles!recipes_author_id_fkey(username)
    `)
    .gte('created_at', startDate.toISOString())
    .order('views_count', { ascending: false })
    .limit(10)

  // Get top users (선택한 기간 내 가입한 사용자 기준)
  const { data: topUsers } = await auth.supabase
    .from('profiles')
    .select('username, recipes_count')
    .gte('created_at', startDate.toISOString())
    .order('recipes_count', { ascending: false })
    .limit(10)

  // Get recent activity stats
  const { data: recentStats } = await auth.supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString())

  return NextResponse.json({
    topRecipes: topRecipes || [],
    topUsers: topUsers || [],
    recentSignups: recentStats?.length || 0,
    range
  })
}
