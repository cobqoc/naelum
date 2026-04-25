import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'
import { checkRateLimit } from '@/lib/ratelimit'

// GET /api/admin/recipes - 레시피 목록 조회 (관리자용)
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
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || '' // 'published' | 'draft' | ''

  let query = auth.supabase
    .from('recipes')
    .select(`
      id,
      title,
      thumbnail_url,
      cuisine_type,
      difficulty_level,
      status,
      views_count,
      average_rating,
      created_at,
      author:profiles!author_id(id, username)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (status === 'published' || status === 'draft' || status === 'private') {
    query = query.eq('status', status)
  }

  query = query.range(offset, rangeEnd)

  const { data: recipes, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    recipes,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}
