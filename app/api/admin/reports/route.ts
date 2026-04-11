import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/admin/reports - 신고 목록 조회
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)

  const { data: reports, error, count } = await auth.supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username, avatar_url),
      reviewer:profiles!reviewed_by(username)
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 신고 대상 엔티티 기본 정보 조회
  const recipeIds = (reports || []).filter(r => r.reported_type === 'recipe').map(r => r.reported_id)
  const userIds = (reports || []).filter(r => r.reported_type === 'user').map(r => r.reported_id)
  const commentIds = (reports || []).filter(r => r.reported_type === 'comment').map(r => r.reported_id)

  const [recipesRes, usersRes, commentsRes] = await Promise.all([
    recipeIds.length > 0
      ? auth.supabase.from('recipes').select('id, title').in('id', recipeIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? auth.supabase.from('profiles').select('id, username').in('id', userIds)
      : Promise.resolve({ data: [] }),
    commentIds.length > 0
      ? auth.supabase.from('recipe_comments').select('id, content, recipe_id').in('id', commentIds)
      : Promise.resolve({ data: [] }),
  ])

  const recipeMap = Object.fromEntries(((recipesRes.data as { id: string; title: string }[]) || []).map(r => [r.id, r]))
  const userMap = Object.fromEntries(((usersRes.data as { id: string; username: string }[]) || []).map(u => [u.id, u]))
  const commentMap = Object.fromEntries(((commentsRes.data as { id: string; content: string; recipe_id: string }[]) || []).map(c => [c.id, c]))

  const reportsWithTarget = (reports || []).map(r => ({
    ...r,
    target_info:
      r.reported_type === 'recipe' ? recipeMap[r.reported_id] ?? null
      : r.reported_type === 'user' ? userMap[r.reported_id] ?? null
      : r.reported_type === 'comment' ? commentMap[r.reported_id] ?? null
      : null,
  }))

  return NextResponse.json({
    reports: reportsWithTarget,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}
