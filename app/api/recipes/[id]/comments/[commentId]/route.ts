import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { sanitizeHtml } from '@/lib/security/sanitize';

// PUT /api/recipes/[id]/comments/[commentId] - 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { content } = await request.json();

  // 유효성 검증
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: '댓글은 1000자를 초과할 수 없습니다' }, { status: 400 });
  }

  // 댓글 소유자 확인
  const { data: comment } = await supabase
    .from('recipe_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  // 댓글 업데이트
  const { data: updatedComment, error } = await supabase
    .from('recipe_comments')
    .update({
      content: sanitizeHtml(content.trim()),
      is_edited: true
    })
    .eq('id', commentId)
    .select(`
      *,
      user:profiles(id, username, avatar_url)
    `)
    .single();

  if (error) {
    console.error('댓글 수정 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: updatedComment });
}

// DELETE /api/recipes/[id]/comments/[commentId] - 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: recipeId, commentId } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // 댓글 소유자 확인
  const { data: comment } = await supabase
    .from('recipe_comments')
    .select('user_id, parent_comment_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  // 답글이 있는지 확인
  const { count: repliesCount } = await supabase
    .from('recipe_comments')
    .select('id', { count: 'exact', head: true })
    .eq('parent_comment_id', commentId)
    .eq('is_deleted', false);

  // 답글이 있으면 Soft Delete, 없으면 Hard Delete
  if (repliesCount && repliesCount > 0) {
    // Soft Delete - 답글 구조 유지
    const { error } = await supabase
      .from('recipe_comments')
      .update({
        is_deleted: true,
        content: '삭제된 댓글입니다'
      })
      .eq('id', commentId);

    if (error) {
      console.error('댓글 삭제 오류 (Soft):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Hard Delete - 완전 삭제
    const { error } = await supabase
      .from('recipe_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('댓글 삭제 오류 (Hard):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 레시피 댓글 수 감소 (trigger가 자동으로 처리하지만, 명시적으로 처리)
  await supabase.rpc('decrement_recipe_comments_count', { recipe_id_input: recipeId });

  return NextResponse.json({ success: true });
}
