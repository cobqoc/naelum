import { guardAdminApi } from '@/lib/api/adminGuard'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/dashboard — 대시보드 통계 + 최근 관리자 활동
// 데이터 계층 이전(docs/DATA_LAYER.md): admin/page.tsx 의 직접 supabase read 2개를 서버로.
// layout 게이트 밖이라 verifyAdmin 으로 자체 admin 인증.
export async function GET(request: NextRequest) {
  // 2026-10-04 AG2-30: IP→rate limit→verifyAdmin 보일러플레이트 → lib/api/adminGuard(같은 키·문구·상태코드)
  const guard = await guardAdminApi(request)
  if (guard.response) return guard.response
  const auth = guard.auth

  // 통계 뷰(1행)와 최근 활동은 독립 → 병렬. 원본은 두 read 의 error 를 조용히 무시하고
  // 빈 값으로 렌더했으므로 동작 보존: 실패해도 null/[] 로 내려보낸다(표면화는 별도 fix).
  const [statsRes, actionsRes] = await Promise.all([
    auth.supabase
      .from('admin_dashboard_stats')
      .select('total_users, new_users_week, new_users_month, total_recipes, new_recipes_week, pending_reports, banned_users_count, views_today, comments_week')
      .single(),
    auth.supabase
      .from('admin_actions')
      .select('id, action_type, created_at, admin:profiles!admin_id(username)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    stats: statsRes.data ?? null,
    recentActions: actionsRes.data ?? [],
  })
}
