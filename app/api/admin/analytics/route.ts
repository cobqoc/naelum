import { guardAdminApi } from '@/lib/api/adminGuard'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/analytics - 통계 데이터 조회
export async function GET(request: NextRequest) {
  // 2026-10-04 AG2-30: IP→rate limit→verifyAdmin 보일러플레이트 → lib/api/adminGuard(같은 키·문구·상태코드)
  const guard = await guardAdminApi(request)
  if (guard.response) return guard.response
  const auth = guard.auth

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '7d' // 7d, 30d, 90d

  // Calculate date range
  const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[range] || 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // 2026-10-04 AG2-04/ADM-13: 세 read 는 서로 결과를 쓰지 않음 → 병렬(이전엔 직렬 3왕복).
  // 신규 가입자 수는 행을 받아 .length 로 세면 PostgREST 1000행 cap 에서 조용히 멈춘다 →
  // count: 'exact', head: true (행 미전송). 1000명 이하에선 같은 숫자.
  const [{ data: topRecipes }, { data: topUsers }, { count: recentSignupsCount }] = await Promise.all([
    // Get top recipes (선택한 기간 내 생성된 레시피 기준)
    auth.supabase
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
      .limit(10),

    // Get top users (선택한 기간 내 가입한 사용자 기준)
    auth.supabase
      .from('profiles')
      .select('username, recipes_count')
      .gte('created_at', startDate.toISOString())
      .order('recipes_count', { ascending: false })
      .limit(10),

    // Get recent activity stats
    auth.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),
  ])

  return NextResponse.json({
    topRecipes: topRecipes || [],
    topUsers: topUsers || [],
    recentSignups: recentSignupsCount || 0,
    range
  })
}
