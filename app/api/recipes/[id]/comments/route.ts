import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { notifyComment } from '@/lib/notifications/create'
import { checkRateLimit } from '@/lib/ratelimit'

// GET /api/recipes/[id]/comments - 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments, error, count } = await supabase
    .from('recipe_comments')
    .select(`
      *,
      user:profiles(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('recipe_id', recipeId)
    .is('parent_comment_id', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // N+1 쿼리 문제 해결: 일괄 조회
  let commentsWithReplies = comments || []

  if (commentsWithReplies.length > 0) {
    const commentIds = commentsWithReplies.map(c => c.id)

    // 1. 모든 댓글의 답글 수를 한 번에 조회
    const { data: repliesData } = await supabase
      .from('recipe_comments')
      .select('parent_comment_id')
      .in('parent_comment_id', commentIds)
      .eq('is_deleted', false)

    // 답글 수 집계
    const repliesCountMap = new Map<string, number>()
    repliesData?.forEach(reply => {
      const count = repliesCountMap.get(reply.parent_comment_id) || 0
      repliesCountMap.set(reply.parent_comment_id, count + 1)
    })

    // 2. 현재 사용자의 좋아요 목록을 한 번에 조회
    let likedCommentIds = new Set<string>()
    if (user) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds)
        .eq('user_id', user.id)

      likedCommentIds = new Set(likes?.map(like => like.comment_id) || [])
    }

    // 3. 데이터 조합
    commentsWithReplies = commentsWithReplies.map(comment => ({
      ...comment,
      replies_count: repliesCountMap.get(comment.id) || 0,
      is_liked: likedCommentIds.has(comment.id)
    }))
  }

  return NextResponse.json({
    comments: commentsWithReplies,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/recipes/[id]/comments - 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { allowed } = await checkRateLimit(`comment:${user.id}`, { windowMs: 60 * 1000, maxRequests: 10 })
  if (!allowed) {
    return NextResponse.json({ error: '댓글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const body = await request.json()
  const content = sanitizeHtml(body.content || '')
  const parent_comment_id = body.parent_comment_id
  const image_url = body.image_url

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 })
  }

  const { data: comment, error } = await supabase
    .from('recipe_comments')
    .insert({
      recipe_id: recipeId,
      user_id: user.id,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      image_url: image_url || null
    })
    .select(`
      *,
      user:profiles(id, username, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 새로 작성한 댓글이므로 is_liked는 false, replies_count는 0
  const commentWithMeta = { ...comment, is_liked: false, replies_count: 0 }

  // 댓글 수 증가
  await supabase.rpc('increment_comments_count', { recipe_id: recipeId })

  // 알림 생성
  const { data: recipe } = await supabase
    .from('recipes')
    .select('author_id, title')
    .eq('id', recipeId)
    .maybeSingle()

  if (recipe && recipe.author_id !== user.id) {
    const { data: commenter } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    await notifyComment(
      supabase,
      recipe.author_id,
      commenter?.username || '누군가',
      recipeId,
      recipe.title,
      user.id,
      comment.id,
    )
  }

  return NextResponse.json({ comment: commentWithMeta }, { status: 201 })
}
