'use client';

import { useRef } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

/**
 * 쿠킹 모드 완성 후 선택 모달 (사진 첨부 + 리뷰/스킵) (순수 표현).
 *
 * god-file(RecipeCookMode) 분해 Phase 2. 사진 상태·완료 API·리뷰 토글은 부모
 * 소유 — 값+콜백만. JSX·className 원본과 byte-identical → 행위 변경 0.
 * 회귀 가드: e2e/cook-completion.spec.ts.
 */

export default function CookCompletionModal({
  t,
  photoPreview,
  onPhotoChange,
  onRemovePhoto,
  onWriteReview,
  onSkip,
  completing,
}: {
  t: TranslationKeys;
  photoPreview: string | null;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onWriteReview: () => void;
  onSkip: () => void;
  completing: boolean;
}) {
  // a11y: 호출처 조건부 마운트 → isOpen=true 고정. ESC=skip (사진 미첨부 + 나가기).
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onSkip, !completing);
  useFocusTrap(true, panelRef);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4" role="dialog" aria-modal="true">
      <div ref={panelRef} className="bg-background-secondary rounded-2xl p-6 max-w-md w-full my-8 border border-white/10">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold mb-2">{t.cookMode.recipeDone}</h3>
          <p className="text-text-secondary text-sm">{t.cookMode.reviewPrompt}</p>
        </div>

        {/* 완성 사진 */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-3">{t.cookMode.completionPhotoLabel}</label>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt={t.cookMode.completionPhotoLabel} className="w-full h-48 object-cover rounded-xl" />
              <button
                onClick={onRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error text-white flex items-center justify-center hover:bg-error/90 transition-all"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="block w-full py-8 border-2 border-dashed border-white/20 rounded-xl hover:border-accent-warm transition-all cursor-pointer bg-background-tertiary">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhotoChange}
                className="hidden"
              />
              <div className="text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="font-bold text-sm">{t.cookMode.takePhoto}</p>
                <p className="text-text-muted text-xs mt-1">{t.cookMode.orSelectFromGallery}</p>
              </div>
            </label>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onWriteReview}
            className="w-full py-3 px-6 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
          >
            {t.cookMode.writeReview}
          </button>
          <button
            onClick={onSkip}
            disabled={completing}
            className="w-full py-3 px-6 rounded-xl bg-background-tertiary text-text-primary font-bold hover:bg-background-primary transition-all disabled:opacity-50"
          >
            {completing ? t.cookMode.saving : t.cookMode.skipReview}
          </button>
        </div>
      </div>
    </div>
  );
}
