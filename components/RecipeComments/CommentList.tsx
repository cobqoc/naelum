'use client';

import { CommentListProps } from './types';
import CommentItem from './CommentItem';
import { useI18n } from '@/lib/i18n/context';

export default function CommentList({
  comments,
  currentUserId,
  recipeId,
  onCommentUpdate,
  onCommentDelete
}: CommentListProps) {
  const { t } = useI18n();

  if (comments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-text-muted mb-2">{t.comments.emptyTitle}</p>
        <p className="text-sm text-text-secondary">
          {t.comments.emptySub}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          recipeId={recipeId}
          depth={0}
          onCommentUpdate={onCommentUpdate}
          onCommentDelete={onCommentDelete}
        />
      ))}
    </div>
  );
}
