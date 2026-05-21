import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { type RecipeStep as Step } from '@/lib/constants/recipe';

/**
 * 레시피 작성 폼의 조리 단계 입력 블록 (presentational).
 *
 * god-file 분해 3번째 down-payment — [[TagsField]]·[[NutritionFields]] 규약 동일:
 *  1. 상태(steps·uploadingImage·draggingStepIndex)·로직(add/remove/update/이미지/DnD)은
 *     전부 부모(page.tsx)가 소유. 이 컴포넌트는 값+콜백만 받는 순수 표현.
 *  2. JSX 는 원본과 byte-identical (마크업·className·핸들러 시그니처 동일) → 행위 변경 0
 *  3. 검증: npm run build(strict props) + e2e/recipe-creation.spec.ts 회귀
 *     ("UI 회귀: 단계/재료/태그 동적 추가" 가 add/update step 을 실제로 exercise)
 *
 * NutritionFields 보다 결합도가 높다(이미지 업로드·드래그앤드롭). 그래서 로직은
 * 일절 옮기지 않고 부모 클로저를 그대로 props 로 전달만 한다(위험 최소화).
 */

interface StepsSectionProps {
  t: TranslationKeys;
  tf: TranslationKeys['recipeForm'];
  steps: Step[];
  uploadingImage: number | null;
  draggingStepIndex: number | null;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: keyof Step, value: string | number | null) => void;
  onImageUpload: (index: number, file: File) => void;
  onImageRemove: (index: number) => void;
  onStepDrag: (e: React.DragEvent) => void;
  onStepDragIn: (e: React.DragEvent, index: number) => void;
  onStepDragOut: (e: React.DragEvent) => void;
  onStepDrop: (e: React.DragEvent, index: number) => void;
}

export default function StepsSection({
  t,
  tf,
  steps,
  uploadingImage,
  draggingStepIndex,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onImageUpload,
  onImageRemove,
  onStepDrag,
  onStepDragIn,
  onStepDragOut,
  onStepDrop,
}: StepsSectionProps) {
  return (
    <>
      {steps.map((step, index) => (
        <div key={index} className="p-4 rounded-xl bg-background-secondary space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <span className="text-sm font-medium">{tf.stepNumber}</span>
            </div>
            {steps.length > 1 && (
              <button
                onClick={() => onRemoveStep(index)}
                className="text-error text-sm hover:underline"
              >
                {t.common.delete}
              </button>
            )}
          </div>

          <textarea
            value={step.instruction}
            onChange={(e) => onUpdateStep(index, 'instruction', e.target.value)}
            className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm min-h-[120px] resize-none"
            placeholder={tf.stepInstructionPlaceholder}
          />

          <input
            type="text"
            value={step.tip}
            onChange={(e) => onUpdateStep(index, 'tip', e.target.value)}
            className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm text-sm"
            placeholder={tf.stepTipPlaceholder}
          />

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-xs text-text-muted">{tf.stepImageLabel}</label>
            {step.image_url ? (
              <div className="relative w-full h-48">
                <Image
                  src={step.image_url}
                  alt={`${tf.stepNumber} ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={() => onImageRemove(index)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-error transition-all"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImageUpload(index, file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={uploadingImage === index}
                />
                <div
                  className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    draggingStepIndex === index
                      ? 'border-accent-warm bg-accent-warm/10'
                      : 'border-white/20 hover:border-accent-warm hover:bg-white/5'
                  }`}
                  onDragOver={onStepDrag}
                  onDragEnter={(e) => onStepDragIn(e, index)}
                  onDragLeave={onStepDragOut}
                  onDrop={(e) => onStepDrop(e, index)}
                >
                  {uploadingImage === index ? (
                    <>
                      <div className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-muted">{tf.uploading}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm text-text-muted">{tf.stepImageAdd}</span>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={onAddStep}
        className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-text-muted hover:border-accent-warm hover:text-accent-warm transition-all"
      >
        {tf.addStep}
      </button>
    </>
  );
}
