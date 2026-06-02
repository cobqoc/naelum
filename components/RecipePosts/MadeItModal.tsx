'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { createClient } from '@/lib/supabase/client';

interface MadeItModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 피드/평점 새로고침
}

/**
 * "만들어봤어요" — 만든 직후 1단계: 사진 + 체감 난이도만(둘 다 선택).
 *  - POST /complete → cooking_session(만든 기록) + 사진(있으면) + difficulty_felt(있으면)
 *  - 맛 별점·후기는 여기서 안 받음 → 먹고 나서 RecipeReviewModal(2단계)에서.
 * 사진=지금 제일 자연스러움, 난이도=방금 따라한 과정이라 신선. 맛은 먹어봐야 아는 신호라 분리.
 */
export default function MadeItModal({ recipeId, isOpen, onClose, onSuccess }: MadeItModalProps) {
  const toast = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const tp = t.posts;
  const [difficulty, setDifficulty] = useState(0); // 0=미선택, 1=쉬움 2=적당 3=어려움
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
    setDifficulty(0); setPhoto(null); setPhotoPreview(null);
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
      // 만든 기록(cooking_session) + 사진 + 체감 난이도. 맛 별점은 2단계(먹고 나서)에서.
      const fd = new FormData();
      if (photo) fd.append('photo', photo);
      if (difficulty > 0) fd.append('difficulty_felt', String(difficulty));
      const completeRes = await fetch(`/api/recipes/${recipeId}/complete`, { method: 'POST', body: fd });
      if (!completeRes.ok) { const d = await completeRes.json(); throw new Error(d.error || tp.madeItError); }

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

        {/* 체감 난이도 (선택) — 만든 직후 과정 신호 */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-text-primary mb-2">{tp.difficultyOptional}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 1, label: tp.diffEasy, emoji: '😊' },
              { v: 2, label: tp.diffMedium, emoji: '🙂' },
              { v: 3, label: tp.diffHard, emoji: '😓' },
            ].map(({ v, label, emoji }) => (
              <button key={v} type="button" onClick={() => setDifficulty(v === difficulty ? 0 : v)} disabled={submitting}
                className={`py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${
                  difficulty === v
                    ? 'border-accent-warm bg-accent-warm/15 text-accent-warm'
                    : 'border-white/10 bg-background-tertiary text-text-secondary hover:text-text-primary'
                }`}>
                <span className="block text-lg mb-0.5">{emoji}</span>{label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-text-muted mt-2">{tp.difficultyHint}</p>
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
