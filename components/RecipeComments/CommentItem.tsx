'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/lib/toast/context';
import { CommentItemProps } from './types';
import CommentForm from './CommentForm';
import RepliesList from './RepliesList';

// 상대 시간 포맷팅 함수
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} 전`;
    }
  }

  return '방금 전';
}

export default function CommentItem({
  comment,
  currentUserId,
  recipeId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isReply = false,
  depth = 0,
  onCommentUpdate,
  onCommentDelete
}: CommentItemProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count || 0);

  const isOwner = currentUserId === comment.user_id;
  const canReply = depth < 2; // 3단계까지 허용 (0, 1, 2)

  // 수정 핸들러
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      toast.warning('댓글 내용을 입력해주세요');
      return;
    }

    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '댓글 수정에 실패했습니다');
      }

      onCommentUpdate(comment.id, {
        content: editedContent.trim(),
        is_edited: true
      });
      setIsEditing(false);
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      toast.error(error instanceof Error ? error.message : '댓글 수정에 실패했습니다');
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments/${comment.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '댓글 삭제에 실패했습니다');
      }

      onCommentDelete(comment.id);
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      toast.error(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다');
      setIsDeleting(false);
    }
  };

  // 답글 작성 완료 핸들러
  const handleReplyCreated = () => {
    setIsReplying(false);
    setRepliesCount(prev => prev + 1); // 답글 수 증가
  };

  // 답글 삭제 시 카운트 감소
  const handleReplyDelete = (commentId: string) => {
    onCommentDelete(commentId);
    setRepliesCount(prev => Math.max(0, prev - 1));
  };

  // 좋아요 핸들러 (낙관적 업데이트)
  const handleLike = async () => {
    if (!currentUserId) {
      toast.warning('로그인 후 좋아요를 누를 수 있습니다');
      return;
    }

    if (isOwner) {
      toast.warning('본인 댓글에는 좋아요를 누를 수 없습니다');
      return;
    }

    if (isLiking) return; // 이미 진행 중이면 무시

    // 이전 상태 저장 (롤백용)
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // 낙관적 업데이트 (즉시 UI 변경)
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(newLiked ? likesCount + 1 : likesCount - 1);
    setIsLiking(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments/${comment.id}/like`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '좋아요 처리에 실패했습니다');
      }

      // API 응답과 UI 상태 동기화
      setIsLiked(data.liked);
    } catch (error) {
      console.error('좋아요 오류:', error);
      // 롤백
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(error instanceof Error ? error.message : '좋아요 처리에 실패했습니다');
    } finally {
      setTimeout(() => setIsLiking(false), 500); // 0.5초 쿨다운
    }
  };

  // 삭제된 댓글 표시
  if (comment.is_deleted) {
    return (
      <div className={`p-4 rounded-xl bg-background-tertiary/50 ${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
        <p className="text-text-muted italic text-sm">삭제된 댓글입니다</p>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
      <div className="p-4 rounded-xl bg-background-secondary border border-white/5">
        {/* 작성자 정보 */}
        <div className="flex items-start gap-3 mb-3">
          <Link href={`/@${comment.user.username}`} className="flex-shrink-0">
            {comment.user.avatar_url ? (
              <Image
                src={comment.user.avatar_url}
                alt={comment.user.username}
                width={40}
                height={40}
                className="rounded-full hover:ring-2 hover:ring-accent-warm/50 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-warm/20 flex items-center justify-center hover:bg-accent-warm/30 transition-colors">
                <span className="text-accent-warm font-bold text-lg">
                  {comment.user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/@${comment.user.username}`}
                className="font-bold text-text-primary hover:text-accent-warm transition-colors"
              >
                {comment.user.username}
              </Link>
              {comment.is_edited && (
                <span className="text-xs text-text-muted">(수정됨)</span>
              )}
            </div>
            <span className="text-xs text-text-muted">{formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>

        {/* 댓글 내용 */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-background-tertiary rounded-lg px-4 py-3 text-text-primary
                         focus:outline-none focus:ring-2 focus:ring-2 focus:ring-accent-warm/50 resize-none"
              rows={3}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-accent-warm text-background-primary rounded-lg font-bold text-sm"
              >
                저장
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg text-sm"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-text-primary mb-3 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* 액션 버튼 */}
        {!isEditing && (
          <div className="flex items-center gap-4 text-sm">
            {/* 좋아요 버튼 */}
            {!isOwner && (
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
                  isLiked ? 'text-error' : 'text-text-muted hover:text-error'
                }`}
              >
                {isLiked ? '❤️' : '🤍'} {likesCount}
              </button>
            )}
            {isOwner && (
              <span className="flex items-center gap-1 text-text-muted">
                🤍 {likesCount}
              </span>
            )}

            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-text-muted hover:text-accent-warm transition-colors"
              >
                💬 답글{repliesCount > 0 ? ` (${repliesCount})` : ''}
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  className="text-text-muted hover:text-accent-warm transition-colors"
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-text-muted hover:text-error transition-colors disabled:opacity-50"
                >
                  🗑️ {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 답글 목록 (항상 표시) */}
      {canReply && repliesCount > 0 && (
        <RepliesList
          parentCommentId={comment.id}
          recipeId={recipeId}
          currentUserId={currentUserId}
          repliesCount={repliesCount}
          depth={depth + 1}
          isOpen={true}
          onToggle={() => {}}
          onCommentUpdate={onCommentUpdate}
          onCommentDelete={handleReplyDelete}
          onReplyCreated={handleReplyCreated}
        />
      )}

      {/* 답글 작성 폼 */}
      {isReplying && canReply && (
        <div className="mt-3 ml-8 md:ml-12">
          <CommentForm
            recipeId={recipeId}
            parentCommentId={comment.id}
            placeholder={`@${comment.user.username}님에게 답글...`}
            onCommentCreated={handleReplyCreated}
            autoFocus
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}
    </div>
  );
}
