import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// POST /api/recipes/[id]/comments/[commentId]/like - 댓글 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  try {
    // RPC 함수를 사용한 트랜잭션 안전한 좋아요 토글
    const { data, error } = await supabase.rpc('toggle_comment_like', {
      p_comment_id: commentId,
      p_user_id: user.id
    });

    if (error) {
      console.error('댓글 좋아요 오류:', error);

      // 커스텀 에러 코드 처리
      if (error.code === 'P0001') {
        return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
      }
      if (error.code === 'P0002') {
        return NextResponse.json({ error: '본인 댓글에는 좋아요를 누를 수 없습니다' }, { status: 400 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('댓글 좋아요 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
