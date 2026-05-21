import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { type RecipeStep as Step } from '@/lib/constants/recipe';

/**
 * 레시피 *수정* 폼 조리 단계 블록 표현 컴포넌트.
 *
 * god-file 분해 Phase 2. ⚠️ recipes/new 의 StepsSection 과 다르다: edit 에는
 * 단계 "제목" input(step.title, tf.stepTitlePlaceholder)이 있고 new 에는 없다.
 * 레이아웃 순서(제목→설명→이미지→팁/타이머)·textarea min-h 도 다름. new 것을
 * 재사용하면 단계 제목 편집 기능이 소실된다(저장 시 step.title 유실 회귀) →
 * edit *현재* JSX 와 byte-identical 한 edit 전용으로 추출. 규약([[TagsField]]
 * 동일): 상태·로직은 page 소유, 값+콜백만. JSX byte-identical → 행위 변경 0.
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

          <input
            type="text"
            value={step.title}
            onChange={(e) => onUpdateStep(index, 'title', e.target.value)}
            className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-accent-warm"
            placeholder={tf.stepTitlePlaceholder}
          />

          <textarea
            value={step.instruction}
            onChange={(e) => onUpdateStep(index, 'instruction', e.target.value)}
            className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-accent-warm min-h-[100px] resize-none"
            placeholder={tf.stepInstructionPlaceholder}
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
                  disabled={uploadingImage === index}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/80 text-white flex items-center justify-center hover:bg-error transition-all"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                  draggingStepIndex === index
                    ? 'border-accent-warm bg-accent-warm/10'
                    : 'border-white/10 hover:border-accent-warm'
                }`}
                onDragOver={onStepDrag}
                onDragEnter={(e) => onStepDragIn(e, index)}
                onDragLeave={onStepDragOut}
                onDrop={(e) => onStepDrop(e, index)}
              >
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
                  disabled={uploadingImage === index}
                  className="hidden"
                />
                {uploadingImage === index ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-muted">{tf.uploading}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-text-muted mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-text-muted">{tf.stepImageAdd}</span>
                  </>
                )}
              </label>
            )}
          </div>

          <input
            type="text"
            value={step.tip}
            onChange={(e) => onUpdateStep(index, 'tip', e.target.value)}
            className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-accent-warm text-sm"
            placeholder={tf.stepTipPlaceholder}
          />
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
