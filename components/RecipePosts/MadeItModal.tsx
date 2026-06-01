'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { createClient } from '@/lib/supabase/client';

interface MadeItModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 피드/평점 새로고침
}

/**
 * "만들어봤어요" — 한 탭 기록(별점·사진·후기는 선택).
 *  - 항상: POST /complete → cooking_session(만든 기록) + 사진(있으면)
 *  - 별점 입력 시: POST /posts → recipe_posts 리뷰(같은 사진 재사용, 피드 노출)
 * 별점은 강제 아님 — "기록 남기면 내 요리 모음에 쌓이고, 별점 매기면 정리에 쓰임".
 */
export default function MadeItModal({ recipeId, isOpen, onClose, onSuccess }: MadeItModalProps) {
  const toast = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const tp = t.posts;
  const [rating, setRating] = useState(0); // 0 = 별점 안 매김(선택)
  const [review, setReview] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEscapeKey(onClose, isOpen && !submitting);
  useFocusTrap(isOpen, panelRef);

  useEffect(() => {
    if (!isOpen) return;
    setRating(0); setReview(''); setPhoto(null); setPhotoPreview(null);
    createClient().auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, [isOpen]);

  const handlePickPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error(t.tipForm.errorImageType); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1) 항상 — 만든 기록(cooking_session) + 사진 업로드
      const fd = new FormData();
      if (photo) fd.append('photo', photo);
      const completeRes = await fetch(`/api/recipes/${recipeId}/complete`, { method: 'POST', body: fd });
      if (!completeRes.ok) { const d = await completeRes.json(); throw new Error(d.error || tp.madeItError); }
      const { photoUrl } = await completeRes.json();

      // 2) 별점 매겼으면 — 리뷰(recipe_posts, 같은 사진 재사용 → 피드 노출)
      if (rating > 0) {
        const postRes = await fetch(`/api/recipes/${recipeId}/posts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, content: review.trim() || null, photo_url: photoUrl ?? null }),
        });
        if (!postRes.ok) { const d = await postRes.json(); throw new Error(d.error || t.recipe.reviewSaveFailed); }
      }

      toast.success(tp.madeItDone);
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tp.madeItError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isLoggedIn === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-background-secondary rounded-2xl p-6 max-w-sm w-full border border-white/10 text-center">
          <div className="text-4xl mb-4">🍳</div>
          <h3 className="text-lg font-bold text-text-primary mb-2">{t.recipe.reviewLoginRequired}</h3>
          <p className="text-sm text-text-muted mb-6">{t.recipe.reviewLoginRequiredDesc}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-secondary text-sm font-medium">{t.common.cancel}</button>
            <button onClick={() => router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`)}
              className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold">{t.common.login}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4" role="dialog" aria-modal="true">
      <div ref={panelRef} className="bg-background-secondary rounded-2xl p-6 max-w-md w-full my-8 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-text-primary">🍳 {tp.madeItTitle}</h3>
          <button onClick={onClose} disabled={submitting} className="w-8 h-8 rounded-full hover:bg-background-tertiary transition-colors flex items-center justify-center disabled:opacity-50">✕</button>
        </div>

        {/* 별점 (선택) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-text-primary mb-2">{tp.ratingOptional}</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star === rating ? 0 : star)} disabled={submitting}
                className="text-4xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-50">
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-text-muted mt-2">{tp.ratingHint}</p>
        </div>

        {/* 완성 사진 (선택) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-text-primary mb-2">{tp.photoOptional}</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePickPhoto(f); }} />
          {photoPreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <Image src={photoPreview} alt={t.recipe.ratingPhotoAlt} fill className="object-cover" unoptimized />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center">✕</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={submitting}
              className="w-full py-6 rounded-xl border-2 border-dashed border-white/15 text-text-muted hover:border-accent-warm/40 hover:text-accent-warm transition-colors text-sm disabled:opacity-50">
              📸 {tp.photoAdd}
            </button>
          )}
        </div>

        {/* 후기 (선택) */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-text-primary mb-2">{tp.reviewOptional}</label>
          <InputBoxWrapper className="!rounded-xl !px-4 !py-3 !min-h-[80px] !items-start">
            <textarea value={review} onChange={(e) => setReview(e.target.value)} disabled={submitting}
              placeholder={t.recipe.reviewPlaceholder} className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none disabled:opacity-50`}
              style={INPUT_INNER_STYLE} rows={3} maxLength={500} />
          </InputBoxWrapper>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 px-6 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? (
            <><div className="w-5 h-5 border-2 border-background-primary/30 border-t-background-primary rounded-full animate-spin" /><span>{t.recipe.reviewSaving}</span></>
          ) : <span>{tp.madeItSubmit}</span>}
        </button>
      </div>
    </div>
  );
}
