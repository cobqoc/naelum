import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { sanitizeHtml } from '@/lib/security/sanitize'

// PUT /api/recipes/[id]/posts/[postId] — 본인 글 수정 (content + 리뷰면 rating)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data: post } = await supabase
    .from('recipe_posts')
    .select('id, user_id, rating, parent_id')
    .eq('id', postId)
    .maybeSingle()
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: '본인 글만 수정할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = { is_edited: true, updated_at: new Date().toISOString() }

  if (body.content !== undefined) {
    const content = sanitizeHtml(String(body.content)).trim()
    // 리뷰는 본문 없이 별점만 허용, 댓글/답글은 본문 필수
    if (!content && post.rating === null) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    }
    updates.content = content || null
  }

  // 리뷰만 별점 수정 허용
  if (body.rating !== undefined && body.rating !== null) {
    if (post.rating === null) {
      return NextResponse.json({ error: '댓글에는 별점을 매길 수 없습니다.' }, { status: 400 })
    }
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 })
    }
    updates.rating = rating
  }
  if (body.photo_url !== undefined && post.rating !== null) {
    updates.photo_url = body.photo_url || null
  }

  const { data: updated, error } = await supabase
    .from('recipe_posts')
    .update(updates)
    .eq('id', postId)
    .eq('user_id', user.id)
    .select(`*, user:profiles(id, username, avatar_url)`)
    .single()
  if (error || !updated) return NextResponse.json({ error: error?.message || '수정 실패' }, { status: 500 })

  return NextResponse.json({ post: updated })
}

// DELETE /api/recipes/[id]/posts/[postId] — 본인 글 삭제 (답글 있으면 soft, 없으면 hard)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data: post } = await supabase
    .from('recipe_posts')
    .select('id, user_id')
    .eq('id', postId)
    .maybeSingle()
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: '본인 글만 삭제할 수 있습니다.' }, { status: 403 })
  }

  // 답글이 남아있으면 soft delete(스레드 보존), 없으면 hard delete
  const { count } = await supabase
    .from('recipe_posts')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', postId)
    .eq('is_deleted', false)

  if ((count || 0) > 0) {
    const { error } = await supabase
      .from('recipe_posts')
      .update({ is_deleted: true, content: null, rating: null, photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('recipe_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
