'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment } from './types';
import CommentItem from './CommentItem';

interface RepliesListProps {
  parentCommentId: string;
  recipeId: string;
  currentUserId: string | null;
  repliesCount: number;
  depth?: number;
  isOpen: boolean;
  onToggle: () => void;
  onCommentUpdate: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete: (commentId: string) => void;
  onReplyCreated: () => void;
}

export default function RepliesList({
  parentCommentId,
  recipeId,
  currentUserId,
  repliesCount,
  depth = 0,
  isOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggle,
  onCommentUpdate,
  onCommentDelete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReplyCreated
}: RepliesListProps) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // 답글 목록 조회
  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments/${parentCommentId}/replies`);
      const data = await res.json();

      if (res.ok) {
        setReplies(data.replies);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('답글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeId, parentCommentId]);

  // 컴포넌트 마운트 시 답글 로드
  useEffect(() => {
    if (!hasLoaded) {
      fetchReplies();
    }
  }, [fetchReplies, hasLoaded]);

  // 답글 수가 변경되면 재조회 (새 답글 작성 시)
  useEffect(() => {
    if (repliesCount > 0 && repliesCount > replies.length) {
      fetchReplies();
    }
  }, [repliesCount, replies.length, fetchReplies]);

  // 답글 업데이트 핸들러
  const handleReplyUpdate = (commentId: string, updates: Partial<Comment>) => {
    setReplies(prev =>
      prev.map(reply => (reply.id === commentId ? { ...reply, ...updates } : reply))
    );
    onCommentUpdate(commentId, updates);
  };

  // 답글 삭제 핸들러
  const handleReplyDelete = (commentId: string) => {
    setReplies(prev => prev.filter(reply => reply.id !== commentId));
    onCommentDelete(commentId);
  };

  // 답글이 없으면 아무것도 표시하지 않음
  if (!isOpen) return null;

  return (
    <div className="mt-3 ml-8 md:ml-12 space-y-3">
      {loading ? (
        // 로딩 스켈레톤
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="p-4 rounded-xl bg-background-secondary/50 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-background-tertiary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-background-tertiary rounded" />
                  <div className="h-3 w-16 bg-background-tertiary rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-background-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              recipeId={recipeId}
              depth={depth}
              onCommentUpdate={handleReplyUpdate}
              onCommentDelete={handleReplyDelete}
            />
          ))}
          {replies.length === 0 && (
            <p className="text-text-muted text-sm py-2">답글이 없습니다</p>
          )}
        </>
      )}
    </div>
  );
}
