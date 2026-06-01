'use client';

import { useState } from 'react';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import type { Post } from './types';

interface ReplyFormProps {
  recipeId: string;
  parentId?: string | null;
  placeholder: string;
  onCreated: (post: Post) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}

// 댓글/답글 텍스트 작성 폼 (별점 없는 글) → POST /posts
export default function ReplyForm({ recipeId, parentId = null, placeholder, onCreated, autoFocus, onCancel }: ReplyFormProps) {
  const toast = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const tc = t.comments;
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text) { toast.warning(tc.errorRequired); return; }
    if (text.length > 1000) { toast.warning(tc.errorTooLong); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.warning(tc.errorLoginRequired);
      router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, parent_id: parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tc.errorCreateFailed);
      setContent('');
      onCreated(data.post);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc.errorCreateFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <InputBoxWrapper className="!rounded-xl !px-4 !py-3 !min-h-[60px] !items-start">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={1000}
          rows={2}
          className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
          style={INPUT_INNER_STYLE}
        />
      </InputBoxWrapper>
      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            {tc.cancel}
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? tc.submitting : (parentId ? tc.submitReply : tc.submitComment)}
        </button>
      </div>
    </div>
  );
}
