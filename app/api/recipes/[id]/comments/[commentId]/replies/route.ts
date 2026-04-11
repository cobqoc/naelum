import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/recipes/[id]/comments/[commentId]/replies - 답글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = await createClient();

  try {
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    // 답글 목록 조회 (삭제된 답글 포함)
    const { data: replies, error } = await supabase
      .from('recipe_comments')
      .select(`
        *,
        user:profiles(id, username, avatar_url)
      `)
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: true }); // 오래된 답글이 위로

    if (error) {
      console.error('답글 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // N+1 쿼리 문제 해결: 일괄 조회
    let repliesWithLikes = replies || [];

    if (repliesWithLikes.length > 0) {
      const replyIds = repliesWithLikes.map(r => r.id);

      // 1. 모든 답글의 답글 수를 한 번에 조회 (3단계 답글)
      const { data: subRepliesData } = await supabase
        .from('recipe_comments')
        .select('parent_comment_id')
        .in('parent_comment_id', replyIds)
        .eq('is_deleted', false);

      // 답글 수 집계
      const repliesCountMap = new Map<string, number>();
      subRepliesData?.forEach(subReply => {
        const count = repliesCountMap.get(subReply.parent_comment_id) || 0;
        repliesCountMap.set(subReply.parent_comment_id, count + 1);
      });

      // 2. 현재 사용자의 좋아요 목록을 한 번에 조회
      let likedReplyIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', replyIds)
          .eq('user_id', user.id);

        likedReplyIds = new Set(likes?.map(like => like.comment_id) || []);
      }

      // 3. 데이터 조합
      repliesWithLikes = repliesWithLikes.map(reply => ({
        ...reply,
        is_liked: likedReplyIds.has(reply.id),
        replies_count: repliesCountMap.get(reply.id) || 0
      }));
    }

    return NextResponse.json({ replies: repliesWithLikes });
  } catch (error) {
    console.error('답글 조회 오류:', error);
    return NextResponse.json(
      { error: '답글 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
