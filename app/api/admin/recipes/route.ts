import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'
import { checkRateLimit } from '@/lib/ratelimit'

// 정렬 가능 컬럼 — 화이트리스트 (임의 컬럼 정렬 차단)
const SORT_COLUMNS: Record<string, string> = {
  created: 'created_at',
  views: 'views_count',
  rating: 'average_rating',
}

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
  const status = searchParams.get('status') || '' // 'published' | 'private' | 'draft' | ''
  const sortCol = SORT_COLUMNS[searchParams.get('sort') || ''] || 'created_at'
  const ascending = searchParams.get('order') === 'asc'

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
    .order(sortCol, { ascending })
    .order('id', { ascending: true }) // 동률 시 결정적 순서 — 페이지네이션 행 누락/중복 방지

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

  // 상태별 개수 — 탭 배지용. search 는 반영하되 status 필터와는 무관(각 탭이 자기 개수).
  const countFor = async (s?: string) => {
    let q = auth.supabase.from('recipes').select('id', { count: 'exact', head: true })
    if (search) q = q.ilike('title', `%${search}%`)
    if (s) q = q.eq('status', s)
    const { count: c } = await q
    return c || 0
  }
  const [cAll, cPublished, cPrivate, cDraft] = await Promise.all([
    countFor(),
    countFor('published'),
    countFor('private'),
    countFor('draft'),
  ])

  return NextResponse.json({
    recipes,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    },
    counts: { all: cAll, published: cPublished, private: cPrivate, draft: cDraft },
  })
}
