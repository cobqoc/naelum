import type { Dispatch, SetStateAction } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 레시피 작성 폼 푸터 — 저작권 동의 + 제출/임시저장 버튼 (presentational).
 *
 * god-file(NewRecipePage) 분해 — [[BasicInfoSection]] 외 규약 동일:
 *  1. 상태(copyrightAgreed·loading·draftLoading)·제출 로직(handleSubmit/
 *     handleDraft)은 전부 부모(page.tsx) 소유. 이 컴포넌트는 값+콜백만
 *     (순수 표현 — ref/async/local state 0).
 *  2. JSX byte-identical(마크업·className·핸들러 시그니처·하드코딩 문구
 *     동일) → 행위 변경 0. 저작권 안내문 i18n 미적용은 선존 상태 그대로
 *     보존(개선은 별도 fix 커밋 — refactor 는 동작 변경 금지).
 *  3. 검증: copyright 게이트(미동의→제출 비활성/동의→활성)·임시저장
 *     버튼 wiring 은 e2e/recipe-creation.spec.ts "UI 회귀" 가 exercise.
 */

interface RecipeFormFooterProps {
  tf: TranslationKeys['recipeForm'];
  copyrightAgreed: boolean;
  setCopyrightAgreed: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  draftLoading: boolean;
  onDraft: () => void;
  onSubmit: () => void;
}

export default function RecipeFormFooter({
  tf,
  copyrightAgreed,
  setCopyrightAgreed,
  loading,
  draftLoading,
  onDraft,
  onSubmit,
}: RecipeFormFooterProps) {
  return (
    <>
        {/* 저작권 동의 */}
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={copyrightAgreed}
              onChange={e => setCopyrightAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-accent-warm flex-shrink-0"
            />
            <span className="text-sm text-text-secondary leading-relaxed">
              이 레시피는 제가 직접 창작하였거나 저작권자의 허락을 받은 콘텐츠입니다.
              타인의 레시피·영상·글에서 표현을 그대로 복사하지 않았음을 확인합니다.
              <a href="/terms" target="_blank" className="text-accent-warm hover:text-accent-hover ml-1">이용약관</a> 제8조 준수에 동의합니다.
            </span>
          </label>
        </div>

        {/* Submit Button */}
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
            disabled={loading || draftLoading || !copyrightAgreed}
            className="flex-[2] py-4 rounded-xl bg-accent-warm text-background-primary text-lg font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
            title={!copyrightAgreed ? '저작권 동의 체크 후 게시할 수 있어요' : undefined}
          >
            {loading ? tf.submitting : tf.submit}
          </button>
        </div>
    </>
  );
}
