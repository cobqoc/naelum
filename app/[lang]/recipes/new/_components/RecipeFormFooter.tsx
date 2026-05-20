import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 레시피 작성 폼 푸터 — 제출/임시저장 버튼 (presentational).
 *
 * 저작권 동의는 가입 페이지 약관 동의로 통합 (2026-05-20). 매 작성마다 체크 받던
 * 박스 제거 — 글로벌 표준(Medium·Substack·WordPress)과 일치. 첫 동의는 가입 시
 * `agreedToCopyright` 필드로 기록·DB 보존됨.
 */

interface RecipeFormFooterProps {
  tf: TranslationKeys['recipeForm'];
  loading: boolean;
  draftLoading: boolean;
  onDraft: () => void;
  onSubmit: () => void;
}

export default function RecipeFormFooter({
  tf,
  loading,
  draftLoading,
  onDraft,
  onSubmit,
}: RecipeFormFooterProps) {
  return (
    <div className="pt-4 flex gap-3">
      <button
        onClick={onDraft}
        disabled={draftLoading || loading}
        className="flex-1 py-4 rounded-xl bg-background-secondary border border-white/10 text-text-secondary font-bold hover:bg-background-tertiary transition-all disabled:opacity-50"
      >
        {draftLoading ? tf.saving : tf.saveDraft}
      </button>
      <button
        onClick={onSubmit}
        disabled={loading || draftLoading}
        className="flex-[2] py-4 rounded-xl bg-accent-warm text-background-primary text-lg font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
      >
        {loading ? tf.submitting : tf.submit}
      </button>
    </div>
  );
}
