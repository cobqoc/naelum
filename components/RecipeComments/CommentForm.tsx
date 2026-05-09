'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { CommentFormProps, Comment } from './types';

export default function CommentForm({
  recipeId,
  parentCommentId = null,
  placeholder,
  onCommentCreated,
  autoFocus = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const supabase = createClient();
  const tc = t.comments;
  const resolvedPlaceholder = placeholder ?? (parentCommentId ? tc.replyPlaceholder : tc.placeholder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError(tc.errorRequired);
      return;
    }

    if (content.length > 1000) {
      setError(tc.errorTooLong);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 로그인 확인
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.warning(tc.errorLoginRequired);
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parent_comment_id: parentCommentId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tc.errorCreateFailed);
      }

      // 성공 시 입력 초기화 및 콜백 실행
      setContent('');
      if (onCommentCreated && data.comment) {
        onCommentCreated(data.comment as Comment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.errorCreateFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-background-secondary rounded-xl p-4 border border-white/5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={resolvedPlaceholder}
        autoFocus={autoFocus}
        className="w-full bg-background-tertiary rounded-lg px-4 py-3 text-base text-text-primary
                   placeholder-text-muted focus:outline-none focus:ring-2
                   focus:ring-2 focus:ring-accent-warm/50 resize-none"
        rows={3}
        disabled={isSubmitting}
      />

      {error && (
        <div className="mt-2 p-2 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {content.length} / 1000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-text-muted hover:bg-background-tertiary transition-all"
              disabled={isSubmitting}
            >
              {tc.cancel}
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-accent-warm text-background-primary rounded-lg font-bold
                       hover:bg-accent-hover transition-all disabled:opacity-50
                       disabled:cursor-not-allowed"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? tc.submitting : parentCommentId ? tc.submitReply : tc.submitComment}
          </button>
        </div>
      </div>
    </form>
  );
}
