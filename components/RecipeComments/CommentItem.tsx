'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from '@/components/Common/LocalizedLink';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { CommentItemProps } from './types';
import CommentForm from './CommentForm';
import RepliesList from './RepliesList';

type TimeTranslations = {
  justNow: string;
  timeAgoYear: string;
  timeAgoMonth: string;
  timeAgoDay: string;
  timeAgoHour: string;
  timeAgoMinute: string;
};

function formatRelativeTime(dateString: string, tc: TimeTranslations): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: { template: string; seconds: number }[] = [
    { template: tc.timeAgoYear,   seconds: 31536000 },
    { template: tc.timeAgoMonth,  seconds: 2592000 },
    { template: tc.timeAgoDay,    seconds: 86400 },
    { template: tc.timeAgoHour,   seconds: 3600 },
    { template: tc.timeAgoMinute, seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return interval.template.replace('{n}', String(count));
    }
  }

  return tc.justNow;
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
  const { t } = useI18n();
  const tc = t.comments;
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
      toast.warning(tc.errorRequired);
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
        throw new Error(data.error || tc.errorEditFailed);
      }

      onCommentUpdate(comment.id, {
        content: editedContent.trim(),
        is_edited: true
      });
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc.errorEditFailed);
    }
  };

  const handleDelete = async () => {
    if (!confirm(tc.confirmDelete)) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments/${comment.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || tc.errorDeleteFailed);
      }

      onCommentDelete(comment.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc.errorDeleteFailed);
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
      toast.warning(tc.errorLikeLogin);
      return;
    }

    if (isOwner) {
      toast.warning(tc.errorLikeOwn);
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
        throw new Error(data.error || tc.errorLikeFailed);
      }

      setIsLiked(data.liked);
    } catch (error) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(error instanceof Error ? error.message : tc.errorLikeFailed);
    } finally {
      setTimeout(() => setIsLiking(false), 500); // 0.5초 쿨다운
    }
  };

  // 삭제된 댓글 표시
  if (comment.is_deleted) {
    return (
      <div className={`p-4 rounded-xl bg-background-tertiary/50 ${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
        <p className="text-text-muted italic text-sm">{tc.deleted}</p>
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
                <span className="text-xs text-text-muted">{tc.edited}</span>
              )}
            </div>
            <span className="text-xs text-text-muted">{formatRelativeTime(comment.created_at, tc)}</span>
          </div>
        </div>

        {/* 댓글 내용 */}
        {isEditing ? (
          <div className="mb-3">
            <InputBoxWrapper className="!rounded-lg !px-4 !py-3 !min-h-[80px] !items-start">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
                style={INPUT_INNER_STYLE}
                rows={3}
              />
            </InputBoxWrapper>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-accent-warm text-background-primary rounded-lg font-bold text-sm"
              >
                {tc.save}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg text-sm"
              >
                {tc.cancel}
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
                💬 {tc.reply}{repliesCount > 0 ? ` (${repliesCount})` : ''}
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  className="text-text-muted hover:text-accent-warm transition-colors"
                >
                  ✏️ {tc.edit}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-text-muted hover:text-error transition-colors disabled:opacity-50"
                >
                  🗑️ {isDeleting ? tc.deleting : tc.delete}
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
            placeholder={t.comments.replyToUser.replace('{username}', comment.user.username)}
            onCommentCreated={handleReplyCreated}
            autoFocus
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}
    </div>
  );
}
