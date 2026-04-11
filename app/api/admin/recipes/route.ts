import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/admin/recipes - 레시피 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
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
      is_published,
      is_public,
      views_count,
      average_rating,
      created_at,
      author:profiles!author_id(id, username)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (status === 'published') {
    query = query.eq('is_published', true)
  } else if (status === 'draft') {
    query = query.eq('is_published', false)
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
