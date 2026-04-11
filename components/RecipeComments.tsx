'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment, CommentsResponse } from './RecipeComments/types';
import CommentForm from './RecipeComments/CommentForm';
import CommentList from './RecipeComments/CommentList';

interface RecipeCommentsProps {
  recipeId: string;
  currentUserId: string | null;
}

export default function RecipeComments({ recipeId, currentUserId }: RecipeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  // 댓글 목록 조회
  const fetchComments = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`/api/recipes/${recipeId}/comments?page=${pageNum}&limit=${limit}`);
      const data: CommentsResponse = await res.json();

      if (res.ok) {
        if (append) {
          setComments(prev => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('댓글 조회 오류:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [recipeId, limit]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // 더보기 버튼 핸들러
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchComments(page + 1, true);
    }
  };

  // 댓글 작성 완료 핸들러
  const handleCommentCreated = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
    setTotalCount(prev => prev + 1);
  };

  // 댓글 업데이트 핸들러
  const handleCommentUpdate = (commentId: string, updates: Partial<Comment>) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      )
    );
  };

  // 댓글 삭제 핸들러
  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setTotalCount(prev => prev - 1);
  };

  const hasMore = page < totalPages;
  const remainingCount = totalCount - comments.length;

  return (
    <section className="px-6 py-8 bg-background-primary">
      <div className="container mx-auto max-w-2xl">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-text-primary mb-6">
          댓글 <span className="text-accent-warm">{totalCount}</span>
        </h2>

        {/* 댓글 작성 폼 */}
        <div className="mb-6">
          <CommentForm
            recipeId={recipeId}
            onCommentCreated={handleCommentCreated}
            placeholder="이 레시피에 대한 의견을 남겨주세요..."
          />
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-xl bg-background-secondary animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-background-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-background-tertiary rounded" />
                    <div className="h-3 w-16 bg-background-tertiary rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-background-tertiary rounded" />
                  <div className="h-4 w-3/4 bg-background-tertiary rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 댓글 목록 */}
            <CommentList
              comments={comments}
              currentUserId={currentUserId}
              recipeId={recipeId}
              onCommentUpdate={handleCommentUpdate}
              onCommentDelete={handleCommentDelete}
            />

            {/* 더보기 버튼 */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 mt-6 rounded-xl bg-background-secondary
                           text-accent-warm font-bold hover:bg-background-tertiary
                           transition-all border border-accent-warm/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore
                  ? '로딩 중...'
                  : `댓글 더보기 (${remainingCount}개 남음)`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
