'use client';

import { CommentListProps } from './types';
import CommentItem from './CommentItem';

export default function CommentList({
  comments,
  currentUserId,
  recipeId,
  onCommentUpdate,
  onCommentDelete
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-text-muted mb-2">첫 댓글을 남겨보세요</p>
        <p className="text-sm text-text-secondary">
          이 레시피에 대한 의견이나 후기를 공유해주세요
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
