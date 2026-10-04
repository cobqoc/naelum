'use client';

import { useState, useCallback, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { useFileUpload, runImageUpload } from '@/lib/hooks/useFileUpload';

/**
 * 팁 작성·수정 폼 공용 상태·핸들러 — tip/new 와 tip/[id]/edit 가 공유 (PAU-27, 2026-10-04).
 *
 * 두 페이지에 상태 11개·핸들러(썸네일 선택·자르기 업로드·단계 이미지·단계 추가/삭제/수정·태그 추가)가
 * 주석 외 글자 하나 다르지 않게 복제돼 있던 것을 그대로 옮겼다(로직·초기값·업로드 설정 동일).
 * 페이지별 차이(자동저장·3버튼 저장/임시저장 — new, 기존 팁 로드·작성자 검사·PUT 저장 — edit)는 각 페이지에 남는다.
 */

export interface TipStep {
  instruction: string;
  tip: string;
  image_url: string | null;
  uploading: boolean;
}

interface UseTipFormArgs {
  supabase: SupabaseClient;
  router: { push: (url: string) => void };
  toast: { error: (msg: string) => void };
  t: TranslationKeys;
}

export function useTipForm({ supabase, router, toast, t }: UseTipFormArgs) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // 카테고리 default '' — 미선택 신호. API 가 빈값을 null 로 저장해 "사용자 능동 선택 vs 자동" 구분.
  const [category, setCategory] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  // 자르기 모달 — 파일 선택 후 사용자가 16:9 영역을 잡을 때까지 보류.
  // null 이면 모달 닫힘. 사용자가 [적용] → crop 결과 File 로 업로드 진행.
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  // 썸네일 업로드 공용 hook — 팁 패턴: loginRequired 토스트 없이 redirect 만.
  const thumbUpload = useFileUpload(supabase, router, toast, {
    bucket: 'recipe-images',
    prefix: 'tip-thumb',
    onSuccess: setThumbnail,
    errors: {
      imageType: t.tipForm.errorImageType, imageSize: t.tipForm.errorImageSize,
      upload: t.tipForm.errorImageUpload,
    },
  });
  const [steps, setSteps] = useState<TipStep[]>([{ instruction: '', tip: '', image_url: null, uploading: false }]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // 한글/일본어/중국어 IME 가드 — tag input Enter 핸들러용.
  // 조합 중 Enter = 한글 확정인데 우리가 가로채면 "고추가루" → "고추, 추, 간O" 식 fragmentation 발생.
  // [[feedback-verify-ime-in-browser]] · recipe substitute chip 패턴과 동일.
  const tagComposingRef = useRef(false);

  // 썸네일 — 파일 선택 → 검증 → 자르기 모달 띄움. 모달이 [적용] 시 cropped File 로 업로드.
  // 자르기 결과는 16:9 비율 — 카드·미리보기 일관성 ([[project-thumbnail-crop-next-session]]).
  const handleThumbnailPick = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error(t.tipForm.errorImageType); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }
    setPendingCropFile(file);
  };

  // 자르기 모달 onCropComplete — modal 닫기 + 공용 hook 으로 업로드.
  const handleCroppedThumbnailUpload = (cropped: File) => {
    setPendingCropFile(null);
    thumbUpload.upload(cropped);
  };

  // 단계 이미지 업로드 — per-index 상태 (steps[i].uploading) 라 runImageUpload 사용.
  const handleStepImageUpload = async (idx: number, file: File) => {
    const setStepUploading = (uploading: boolean) =>
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading } : s));
    await runImageUpload(supabase, router, toast, file, {
      bucket: 'recipe-images',
      prefix: `tip-step-${idx}`,
      onStart: () => setStepUploading(true),
      onFinally: () => setStepUploading(false),
      onSuccess: (url) =>
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: url } : s)),
      errors: {
        imageType: t.tipForm.errorImageType, imageSize: t.tipForm.errorImageSize,
        upload: t.tipForm.errorImageUpload,
      },
    });
  };

  const addStep = () => setSteps(prev => [...prev, { instruction: '', tip: '', image_url: null, uploading: false }]);
  const removeStep = (idx: number) => {
    if (steps.length === 1) return;
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };
  const updateStep = (idx: number, field: keyof TipStep, value: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addTag = useCallback(() => {
    const tagText = tagInput.trim();
    if (tagText && !tags.includes(tagText) && tags.length < 10) {
      setTags(prev => [...prev, tagText]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  return {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    durationMinutes, setDurationMinutes,
    thumbnail, setThumbnail,
    pendingCropFile, setPendingCropFile,
    thumbUpload,
    steps, setSteps,
    tagInput, setTagInput,
    tags, setTags,
    tagComposingRef,
    handleThumbnailPick,
    handleCroppedThumbnailUpload,
    handleStepImageUpload,
    addStep, removeStep, updateStep,
    addTag,
  };
}

export type TipForm = ReturnType<typeof useTipForm>;
