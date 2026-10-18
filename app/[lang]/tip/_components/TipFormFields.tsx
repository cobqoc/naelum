'use client';

import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { CATEGORIES, CATEGORY_ICONS } from './tipCategories';
import type { TipForm } from './useTipForm';

/**
 * 팁 작성·수정 폼 필드(썸네일·제목·카테고리·소요시간·설명·단계·태그·에러) — 순수 표현 (PAU-27, 2026-10-04).
 *
 * tip/new 와 tip/[id]/edit 에 192줄이 주석 3줄과 썸네일 alt 1곳 외 똑같이 복제돼 있던 블록을 그대로 옮겼다
 * (마크업·className·핸들러 동일). alt 차이는 `thumbnailAlt` prop 으로 보존(new = t.tipForm.thumbnailLabel,
 * edit = "thumbnail"). 저장 버튼·자동저장 배너·로드 화면은 각 페이지에 남는다. 회귀 가드:
 * .render-eq 하네스(구 블록과 HTML 동일), e2e tip-creation·thumbnail-crop(data-testid="thumbnail-file-input").
 */

interface TipFormFieldsProps {
  t: TranslationKeys;
  form: TipForm;
  /** 썸네일 미리보기 alt — 두 페이지의 기존 값 보존용 */
  thumbnailAlt: string;
  error: string;
}

export default function TipFormFields({ t, form, thumbnailAlt, error }: TipFormFieldsProps) {
  const {
    thumbnail, setThumbnail, thumbUpload, handleThumbnailPick,
    title, setTitle,
    category, setCategory,
    durationMinutes, setDurationMinutes,
    description, setDescription,
    steps, setSteps, removeStep, handleStepImageUpload, updateStep, addStep,
    tagInput, setTagInput, tagComposingRef, addTag,
    tags, setTags,
  } = form;

  return (
    <>
      {/* 썸네일 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.thumbnailLabel}</label>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="thumbnail-file-input"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleThumbnailPick(file);
              e.target.value = '';
            }}
          />
          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-background-secondary border border-white/10 flex items-center justify-center hover:border-accent-warm/40 transition-colors">
            {thumbnail ? (
              <Image src={thumbnail} alt={thumbnailAlt} fill className="object-cover" />
            ) : thumbUpload.uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
            ) : (
              <div className="text-center text-text-muted">
                <div className="text-3xl mb-1">📷</div>
                <p className="text-sm">{t.tipForm.thumbnailUploadHint}</p>
              </div>
            )}
          </div>
        </label>
        {thumbnail && (
          <button onClick={() => setThumbnail(null)} className="mt-2 text-xs text-error hover:underline">{t.tipForm.removeImage}</button>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.titleLabel}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={t.tipForm.titlePlaceholder}
            maxLength={200}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>

      {/* 카테고리 + 소요시간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.categoryLabel}</label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className={`${INPUT_INNER_COMFORTABLE_CLASS} cursor-pointer`}
              style={INPUT_INNER_STYLE}
            >
              <option value="" disabled>{t.tipForm.categoryPlaceholder}</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_ICONS[c]} {t.tipForm.categories[c as keyof typeof t.tipForm.categories]}</option>
              ))}
            </select>
          </InputBoxWrapper>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.durationLabel}</label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <input
              type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)}
              placeholder={t.tipForm.durationPlaceholder}
              min={1} max={999}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
        </div>
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.descriptionLabel}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3 !min-h-[100px] !items-start">
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t.tipForm.descriptionPlaceholder}
            rows={3}
            maxLength={500}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>

      {/* 단계 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">{t.tipForm.stepsLabel}</label>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-background-secondary rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-accent-warm">Step {idx + 1}</span>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(idx)} className="text-xs text-text-muted hover:text-error transition-colors">{t.tipForm.deleteStep}</button>
                )}
              </div>

              {/* 단계 이미지 */}
              <label className="block cursor-pointer mb-3">
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleStepImageUpload(idx, e.target.files[0])} />
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-background-tertiary border border-white/5 flex items-center justify-center hover:border-accent-warm/30 transition-colors">
                  {step.image_url ? (
                    <Image src={step.image_url} alt={`step ${idx + 1}`} fill className="object-cover" />
                  ) : step.uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
                  ) : (
                    <span className="text-text-muted text-sm">{t.tipForm.stepImageHint}</span>
                  )}
                </div>
              </label>
              {step.image_url && (
                <button onClick={() => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: null } : s))} className="text-xs text-error hover:underline mb-2 block">{t.tipForm.removeStepImage}</button>
              )}

              {/* 지시사항 */}
              <InputBoxWrapper className="!rounded-xl !px-3 !py-2.5 !min-h-[60px] !items-start mb-2">
                <textarea
                  value={step.instruction}
                  onChange={e => updateStep(idx, 'instruction', e.target.value)}
                  placeholder={t.tipForm.stepInstructionPlaceholder}
                  rows={2}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} text-sm resize-none`}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>

              {/* 팁 */}
              <InputBoxWrapper className="!rounded-xl !px-3 !py-2">
                <input
                  type="text" value={step.tip}
                  onChange={e => updateStep(idx, 'tip', e.target.value)}
                  placeholder={t.tipForm.stepTipPlaceholder}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} text-sm`}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          className="mt-3 w-full py-3 rounded-xl border border-dashed border-white/20 text-text-muted hover:border-accent-warm/40 hover:text-accent-warm transition-colors text-sm"
        >
          {t.tipForm.addStep}
        </button>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.tagsLabel}</label>
        <div className="flex gap-2 mb-2">
          <InputBoxWrapper className="flex-1 !bg-background-secondary !rounded-xl !px-4 !py-2.5">
            <input
              type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
              onCompositionStart={() => { tagComposingRef.current = true; }}
              onCompositionEnd={() => { tagComposingRef.current = false; }}
              onKeyDown={e => {
                if (e.key !== 'Enter') return;
                if (tagComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
                e.preventDefault();
                addTag();
              }}
              placeholder={t.tipForm.tagPlaceholder}
              className={`${INPUT_INNER_COMFORTABLE_CLASS} text-sm`}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
          <button onClick={addTag} className="px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-sm hover:border-accent-warm/40 transition-colors">{t.tipForm.addTag}</button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-sm">
                #{tag}
                <button onClick={() => setTags(prev => prev.filter(tag2 => tag2 !== tag))} className="hover:text-error ml-1">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}
    </>
  );
}
