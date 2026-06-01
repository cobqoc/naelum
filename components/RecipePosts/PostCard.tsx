'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from '@/components/Common/LocalizedLink';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { Post, formatRelativeTime } from './types';
import ReplyForm from './ReplyForm';
import PostReplies from './PostReplies';

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  recipeId: string;
  isReply?: boolean;
  onUpdate: (id: string, updates: Partial<Post>) => void;
  onDelete: (id: string) => void;
  onRatingChanged?: () => void; // 리뷰 별점 변경 시 부모 평균 새로고침
}

export default function PostCard({ post, currentUserId, recipeId, isReply = false, onUpdate, onDelete, onRatingChanged }: PostCardProps) {
  const toast = useToast();
  const { t } = useI18n();
  const tc = t.comments;
  const isReview = post.rating !== null;
  const isOwner = currentUserId === post.user_id;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editRating, setEditRating] = useState(post.rating || 5);
  const [isReplying, setIsReplying] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [repliesCount, setRepliesCount] = useState(post.replies_count || 0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = async () => {
    const text = editContent.trim();
    if (!isReview && !text) { toast.warning(tc.errorRequired); return; }
    try {
      const body: Record<string, unknown> = { content: text };
      if (isReview) body.rating = editRating;
      const res = await fetch(`/api/recipes/${recipeId}/posts/${post.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tc.errorEditFailed);
      onUpdate(post.id, { content: text, rating: isReview ? editRating : null, is_edited: true });
      setIsEditing(false);
      if (isReview) onRatingChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc.errorEditFailed);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || tc.errorDeleteFailed); }
      onDelete(post.id);
      setDeleteOpen(false);
      if (isReview) onRatingChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc.errorDeleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) { toast.warning(tc.errorLikeLogin); return; }
    if (isOwner) { toast.warning(tc.errorLikeOwn); return; }
    if (isLiking) return;
    const prevLiked = isLiked, prevCount = likesCount;
    const next = !isLiked;
    setIsLiked(next); setLikesCount(next ? likesCount + 1 : likesCount - 1); setIsLiking(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/posts/${post.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tc.errorLikeFailed);
      setIsLiked(data.liked);
    } catch (e) {
      setIsLiked(prevLiked); setLikesCount(prevCount);
      toast.error(e instanceof Error ? e.message : tc.errorLikeFailed);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  if (post.is_deleted) {
    return (
      <div className={`p-4 rounded-xl bg-background-tertiary/50 ${isReply ? 'ml-8 md:ml-12' : ''}`}>
        <p className="text-text-muted italic text-sm">{tc.deleted}</p>
      </div>
    );
  }

  return (
    <div className={isReply ? 'ml-8 md:ml-12' : ''}>
      <div className="p-4 rounded-xl bg-background-secondary border border-white/5">
        {/* 작성자 */}
        <div className="flex items-start gap-3 mb-2">
          <Link href={`/@${post.user.username}`} className="flex-shrink-0">
            {post.user.avatar_url ? (
              <Image src={post.user.avatar_url} alt={post.user.username} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-warm/20 flex items-center justify-center">
                <span className="text-accent-warm font-bold text-lg">{post.user.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/@${post.user.username}`} className="font-bold text-text-primary hover:text-accent-warm transition-colors">
                {post.user.username}
              </Link>
              {isReview && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-warm/15 text-accent-warm font-medium">
                  ✓ {t.posts.cookedBadge}
                </span>
              )}
              {post.is_edited && <span className="text-xs text-text-muted">{tc.edited}</span>}
            </div>
            <span className="text-xs text-text-muted" suppressHydrationWarning>{formatRelativeTime(post.created_at, t.comments)}</span>
          </div>
        </div>

        {/* 별점 (리뷰) */}
        {isReview && !isEditing && (
          <div className="mb-2 text-lg" aria-label={`${post.rating}/5`}>
            {'⭐'.repeat(post.rating || 0)}<span className="text-text-muted">{'☆'.repeat(5 - (post.rating || 0))}</span>
          </div>
        )}

        {/* 본문 / 편집 */}
        {isEditing ? (
          <div className="mb-3">
            {isReview && (
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setEditRating(s)} className="text-2xl transition-transform hover:scale-110">
                    {s <= editRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            )}
            <InputBoxWrapper className="!rounded-lg !px-4 !py-3 !min-h-[80px] !items-start">
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3}
                className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`} style={INPUT_INNER_STYLE} maxLength={1000} />
            </InputBoxWrapper>
            <div className="mt-2 flex gap-2">
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-accent-warm text-background-primary rounded-lg font-bold text-sm">{tc.save}</button>
              <button onClick={() => { setIsEditing(false); setEditContent(post.content || ''); setEditRating(post.rating || 5); }}
                className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg text-sm">{tc.cancel}</button>
            </div>
          </div>
        ) : (
          <>
            {post.content && <p className="text-text-primary mb-2 whitespace-pre-wrap break-words">{post.content}</p>}
            {post.photo_url && (
              <div className="mb-3 relative w-full max-w-xs aspect-square rounded-xl overflow-hidden">
                <Image src={post.photo_url} alt={t.recipe.ratingPhotoAlt} fill className="object-cover" />
              </div>
            )}
          </>
        )}

        {/* 액션 */}
        {!isEditing && (
          <div className="flex items-center gap-4 text-sm">
            <button onClick={handleLike} disabled={isLiking || isOwner}
              className={`flex items-center gap-1 transition-colors disabled:opacity-60 ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}>
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </button>
            {!isReply && (
              <button onClick={() => setIsReplying(!isReplying)} className="text-text-muted hover:text-accent-warm transition-colors">
                💬 {tc.reply}{repliesCount > 0 ? ` (${repliesCount})` : ''}
              </button>
            )}
            {isOwner && (
              <>
                <button onClick={() => { setIsEditing(true); setEditContent(post.content || ''); setEditRating(post.rating || 5); }}
                  className="text-text-muted hover:text-accent-warm transition-colors">✏️ {tc.edit}</button>
                <button onClick={() => setDeleteOpen(true)} disabled={isDeleting}
                  className="text-text-muted hover:text-error transition-colors disabled:opacity-50">🗑️ {isDeleting ? tc.deleting : tc.delete}</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 답글 (1단) */}
      {!isReply && repliesCount > 0 && (
        <PostReplies parentId={post.id} recipeId={recipeId} currentUserId={currentUserId}
          onReplyDelete={(id) => { onDelete(id); setRepliesCount(c => Math.max(0, c - 1)); }} />
      )}

      {/* 답글 작성 */}
      {isReplying && !isReply && (
        <div className="mt-3 ml-8 md:ml-12">
          <ReplyForm recipeId={recipeId} parentId={post.id}
            placeholder={t.comments.replyToUser.replace('{username}', post.user.username)}
            autoFocus onCancel={() => setIsReplying(false)}
            onCreated={() => { setIsReplying(false); setRepliesCount(c => c + 1); }} />
        </div>
      )}

      <ConfirmDialog isOpen={deleteOpen} title={tc.confirmDelete} destructive loading={isDeleting}
        onConfirm={confirmDelete} onCancel={() => { if (!isDeleting) setDeleteOpen(false); }} />
    </div>
  );
}
