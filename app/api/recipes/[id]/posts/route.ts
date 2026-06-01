import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { notifyComment, notifyRating } from '@/lib/notifications/create'
import { checkRateLimit } from '@/lib/ratelimit'
import { getBlockedUserIds, toNotInList } from '@/lib/social/blocks'

/**
 * 통합 피드 API (recipe_posts) — 리뷰(별점)·댓글·답글을 한 테이블에서 다룬다.
 *  - 리뷰 = 최상위 글 + rating(1~5)  → average_rating/ratings_count 반영(트리거)
 *  - 댓글 = 최상위 글 + rating NULL
 *  - 답글 = parent_id 있는 글(1단)
 */

// GET /api/recipes/[id]/posts?filter=all|reviews — 통합 피드(최상위 글)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: recipeId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)
  const filter = searchParams.get('filter') === 'reviews' ? 'reviews' : 'all'

  const { data: { user } } = await supabase.auth.getUser()
  const notInList = toNotInList(await getBlockedUserIds(supabase, user?.id))

  let query = supabase
    .from('recipe_posts')
    .select(`*, user:profiles(id, username, avatar_url)`, { count: 'exact' })
    .eq('recipe_id', recipeId)
    .is('parent_id', null)
    .eq('is_deleted', false)
  if (filter === 'reviews') query = query.not('rating', 'is', null)
  if (notInList) query = query.not('user_id', 'in', notInList)

  const { data: posts, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let withMeta = posts || []
  if (withMeta.length > 0) {
    const ids = withMeta.map(p => p.id)

    // 답글 수 (차단 사용자 제외 — 목록과 일관)
    let repliesQ = supabase
      .from('recipe_posts')
      .select('parent_id')
      .in('parent_id', ids)
      .eq('is_deleted', false)
    if (notInList) repliesQ = repliesQ.not('user_id', 'in', notInList)
    const { data: replies } = await repliesQ
    const replyCount = new Map<string, number>()
    replies?.forEach(r => replyCount.set(r.parent_id, (replyCount.get(r.parent_id) || 0) + 1))

    // 현재 사용자 좋아요
    let likedIds = new Set<string>()
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', ids)
        .eq('user_id', user.id)
      likedIds = new Set(likes?.map(l => l.post_id) || [])
    }

    withMeta = withMeta.map(p => ({
      ...p,
      replies_count: replyCount.get(p.id) || 0,
      is_liked: likedIds.has(p.id),
    }))
  }

  // 헤더용 평균/리뷰수(denormalized 컬럼) + 만든 수(공개 집계 — cooking_sessions RLS 우회 RPC)
  const [{ data: recipe }, { data: cooked }] = await Promise.all([
    supabase.from('recipes').select('average_rating, ratings_count').eq('id', recipeId).maybeSingle(),
    supabase.rpc('recipe_cooked_count', { p_recipe_id: recipeId }),
  ])

  return NextResponse.json({
    posts: withMeta,
    averageRating: recipe?.average_rating ?? 0,
    ratingsCount: recipe?.ratings_count ?? 0,
    cookedCount: cooked ?? 0,
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  })
}

// POST /api/recipes/[id]/posts — 글 작성 (리뷰/댓글/답글)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: recipeId } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { allowed } = await checkRateLimit(`post:${user.id}`, { windowMs: 60 * 1000, maxRequests: 10 })
  if (!allowed) {
    return NextResponse.json({ error: '작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const body = await request.json()
  const parentId: string | null = body.parent_id || null
  const hasRating = body.rating !== undefined && body.rating !== null
  const content = body.content ? sanitizeHtml(String(body.content)).trim() : ''
  const photoUrl: string | null = body.photo_url || null

  // 레시피 작성자 조회 (본인 리뷰 차단 + 알림용)
  const { data: recipe } = await supabase
    .from('recipes')
    .select('author_id, title')
    .eq('id', recipeId)
    .maybeSingle()
  if (!recipe) return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 })

  // ── 리뷰(별점) ──
  if (hasRating) {
    if (parentId) {
      return NextResponse.json({ error: '답글에는 별점을 매길 수 없습니다.' }, { status: 400 })
    }
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 })
    }
    if (recipe.author_id === user.id) {
      return NextResponse.json({ error: '본인 레시피에는 별점을 매길 수 없습니다.' }, { status: 403 })
    }

    // "만들어봤어요" 선언 — cooking_session 보장(트렌딩·검색배지·프로필 일관). 없을 때만 생성.
    const { data: existingSession } = await supabase
      .from('cooking_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .not('completed_at', 'is', null)
      .maybeSingle()
    if (!existingSession) {
      const now = new Date().toISOString()
      await supabase.from('cooking_sessions').insert({
        user_id: user.id, recipe_id: recipeId, started_at: now, completed_at: now,
      })
    }

    // 유저당 리뷰 1개 — 있으면 수정, 없으면 생성
    const { data: existing } = await supabase
      .from('recipe_posts')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .not('rating', 'is', null)
      .is('parent_id', null)
      .eq('is_deleted', false)
      .maybeSingle()

    let post, err
    if (existing) {
      const r = await supabase
        .from('recipe_posts')
        .update({ rating, content: content || null, photo_url: photoUrl, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select(`*, user:profiles(id, username, avatar_url)`)
        .single()
      post = r.data; err = r.error
    } else {
      const r = await supabase
        .from('recipe_posts')
        .insert({ recipe_id: recipeId, user_id: user.id, rating, content: content || null, photo_url: photoUrl })
        .select(`*, user:profiles(id, username, avatar_url)`)
        .single()
      post = r.data; err = r.error
    }
    if (err || !post) return NextResponse.json({ error: err?.message || '저장 실패' }, { status: 500 })

    if (!existing && recipe.author_id !== user.id) {
      const { data: rater } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      await notifyRating(supabase, recipe.author_id, rater?.username || '누군가', recipeId, recipe.title, rating, user.id)
    }
    return NextResponse.json({ post: { ...post, replies_count: 0, is_liked: false } }, { status: 201 })
  }

  // ── 댓글/답글 ──
  if (!content) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }
  if (parentId) {
    const { data: parent } = await supabase
      .from('recipe_posts')
      .select('id, parent_id, recipe_id, is_deleted')
      .eq('id', parentId)
      .maybeSingle()
    if (!parent || parent.recipe_id !== recipeId || parent.is_deleted) {
      return NextResponse.json({ error: '원본 글을 찾을 수 없습니다.' }, { status: 400 })
    }
    if (parent.parent_id) {
      return NextResponse.json({ error: '답글에는 답글을 달 수 없습니다.' }, { status: 400 })
    }
  }

  const { data: post, error: insErr } = await supabase
    .from('recipe_posts')
    .insert({ recipe_id: recipeId, user_id: user.id, content, photo_url: photoUrl, parent_id: parentId })
    .select(`*, user:profiles(id, username, avatar_url)`)
    .single()
  if (insErr || !post) return NextResponse.json({ error: insErr?.message || '저장 실패' }, { status: 500 })

  // 최상위 댓글이면 레시피 작성자에게 알림
  if (!parentId && recipe.author_id !== user.id) {
    const { data: commenter } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    await notifyComment(supabase, recipe.author_id, commenter?.username || '누군가', recipeId, recipe.title, user.id, post.id)
  }

  return NextResponse.json({ post: { ...post, replies_count: 0, is_liked: false } }, { status: 201 })
}
