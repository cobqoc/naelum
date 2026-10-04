'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { useAutosave, loadAutosave, clearAutosave } from '@/lib/hooks/useAutosave';
import ImageCropModal from '@/components/Common/ImageCropModal';
import { useTipForm, type TipStep } from '../_components/useTipForm';
import TipFormFields from '../_components/TipFormFields';

// 자동저장 상수 — 모듈 레벨 (매 렌더마다 새 reference 회피 → useEffect deps 안정)
const AUTOSAVE_KEY = 'naelum_tip_new_autosave_v1';
const AUTOSAVE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export default function TipNewPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const toast = useToast();

  // 폼 공용 상태·핸들러(썸네일·단계·태그 등) — tip/[id]/edit 와 공유 (PAU-27, 2026-10-04: 두 페이지에 그대로 복제돼 있었음)
  const form = useTipForm({ supabase, router, toast, t });
  const {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    durationMinutes, setDurationMinutes,
    thumbnail, setThumbnail,
    pendingCropFile, setPendingCropFile, handleCroppedThumbnailUpload,
    steps, setSteps,
    tags, setTags,
  } = form;
  // 저장 진행 상태 — 3개 액션(임시저장/비공개/공개) 중 무엇이 진행 중인지.
  const [pending, setPending] = useState<'draft' | 'private' | 'public' | null>(null);
  const [error, setError] = useState('');

  // 자동저장 — localStorage 백업 (게시·임시저장 시 clear). 상수는 모듈 레벨.
  const [autosaveRestoreVisible, setAutosaveRestoreVisible] = useState(false);
  type AutosaveSnapshot = {
    title: string; description: string; category: string;
    durationMinutes: string;
    thumbnail: string | null;
    steps: TipStep[]; tags: string[];
  };
  const autosaveSnapshotRef = useRef<AutosaveSnapshot | null>(null);

  const autosaveData = useMemo<AutosaveSnapshot>(() => ({
    title, description, category, durationMinutes, thumbnail,
    steps, tags,
  }), [title, description, category, durationMinutes, thumbnail, steps, tags]);

  // title 빈 폼은 자동저장 skip — banner 표시 조건(`title?.trim()`)과 일관 + "버리기" 후
  // useAutosave 가 빈 폼을 다시 저장하던 race 차단.
  useAutosave(AUTOSAVE_KEY, autosaveData, {
    enabled: !autosaveRestoreVisible && title.trim().length > 0,
  });

  useEffect(() => {
    const saved = loadAutosave<AutosaveSnapshot>(AUTOSAVE_KEY, AUTOSAVE_MAX_AGE);
    if (saved && saved.data.title?.trim()) {
      autosaveSnapshotRef.current = saved.data;
      setAutosaveRestoreVisible(true);
    }
  }, []);

  const handleRestoreAutosave = () => {
    const s = autosaveSnapshotRef.current;
    if (!s) return;
    setTitle(s.title || '');
    setDescription(s.description || '');
    setCategory(s.category || '');
    setDurationMinutes(s.durationMinutes || '');
    if (s.thumbnail) setThumbnail(s.thumbnail);
    if (Array.isArray(s.steps) && s.steps.length > 0) {
      setSteps(s.steps.map(st => ({ ...st, uploading: false })));
    }
    if (Array.isArray(s.tags)) setTags(s.tags);
    setAutosaveRestoreVisible(false);
  };

  const handleDiscardAutosave = () => {
    clearAutosave(AUTOSAVE_KEY);
    autosaveSnapshotRef.current = null;
    setAutosaveRestoreVisible(false);
  };

  // 공개/비공개 저장 — 둘 다 완성된 팁(is_draft=false). is_public 만 다름.
  const handleSubmit = async (isPublic: boolean) => {
    setError('');
    if (!title.trim()) { setError(t.tipForm.errorTitleRequired); return; }
    if (title.length > 200) { setError(t.common.errorTitleTooLong); return; }
    if (description.length > 500) { setError(t.common.errorDescriptionTooLong); return; }
    if (steps.some(s => !s.instruction.trim())) { setError(t.tipForm.errorStepRequired); return; }

    setPending(isPublic ? 'public' : 'private');
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, thumbnail_url: thumbnail,
          category, duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          is_public: isPublic,
          steps: steps.map(({ instruction, tip, image_url }) => ({ instruction, tip, image_url })),
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.tipForm.errorGeneric); return; }
      clearAutosave(AUTOSAVE_KEY);
      if (isPublic) {
        router.push(`/tip/${data.tip.id}`);
      } else {
        // 비공개 팁은 공개 목록에 안 뜨므로 프로필 비공개 탭으로 이동
        // 토스트는 username fallback 무관하게 항상 노출 — 사용자에게 저장 확인 신호
        // username 은 POST 응답에 동봉됨(클라 직접 read 제거, docs/DATA_LAYER.md)
        toast.success(t.tipForm.toastSavedPrivate);
        router.push(data.username ? `/@${data.username}?tab=private` : '/');
      }
    } catch {
      setError(t.tipForm.errorGeneric);
    } finally {
      setPending(null);
    }
  };

  const handleDraft = async () => {
    setError('');
    if (!title.trim()) { setError(t.tipForm.errorTitleRequired); return; }
    if (title.length > 200) { setError(t.common.errorTitleTooLong); return; }
    if (description.length > 500) { setError(t.common.errorDescriptionTooLong); return; }
    setPending('draft');
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          thumbnail_url: thumbnail,
          category,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          is_draft: true,
          steps: steps.filter(s => s.instruction.trim()).map(({ instruction, tip, image_url }) => ({ instruction, tip, image_url })),
          tags,
        }),
      });
      const data = await res.json();
      // 미인증이면 POST 가 401 → 여기서 처리(별도 getUser 가드 불필요).
      if (!res.ok) { setError(data.error || t.tipForm.errorGeneric); return; }

      // username 은 POST 응답에 동봉됨(클라 직접 read 제거, docs/DATA_LAYER.md)
      clearAutosave(AUTOSAVE_KEY);
      toast.success(t.tipForm.toastSavedDraft);
      router.push(data.username ? `/@${data.username}?tab=drafts` : '/');
    } catch {
      setError(t.tipForm.errorGeneric);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">←</Link>
          <h1 className="text-2xl font-bold">{t.tipForm.pageTitle}</h1>
        </div>

        {/* 자동저장 복원 배너 */}
        {autosaveRestoreVisible && (
          <div className="mb-6 rounded-xl bg-accent-warm/10 border border-accent-warm/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-2xl">💾</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t.recipeForm.autosaveRestoreBanner}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestoreAutosave}
                className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t.recipeForm.autosaveRestore}
              </button>
              <button
                type="button"
                onClick={handleDiscardAutosave}
                className="px-4 py-2 rounded-lg bg-background-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
              >
                {t.recipeForm.autosaveDiscard}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* 썸네일·제목·카테고리·소요시간·설명·단계·태그·에러 — tip/[id]/edit 와 공용 (PAU-27) */}
          <TipFormFields t={t} form={form} thumbnailAlt={t.tipForm.thumbnailLabel} error={error} />

          {/* 저장 — 임시저장 / 비공개 / 공개 를 명시적으로 선택 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDraft} disabled={pending !== null}
              className="flex-1 py-4 rounded-xl bg-background-secondary border border-white/10 text-text-secondary font-bold hover:bg-background-tertiary transition-colors disabled:opacity-50"
            >
              {pending === 'draft' ? t.tipForm.saving : t.tipForm.saveDraft}
            </button>
            <button
              onClick={() => handleSubmit(false)} disabled={pending !== null}
              className="flex-1 py-4 rounded-xl bg-background-secondary border border-white/10 text-text-secondary font-bold hover:bg-background-tertiary transition-colors disabled:opacity-50"
            >
              {pending === 'private' ? t.tipForm.saving : t.tipForm.savePrivate}
            </button>
            <button
              onClick={() => handleSubmit(true)} disabled={pending !== null}
              className="flex-1 py-4 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {pending === 'public' ? t.tipForm.uploading : t.tipForm.submit}
            </button>
          </div>
        </div>
      </main>
      <ImageCropModal
        file={pendingCropFile}
        onCropComplete={handleCroppedThumbnailUpload}
        onCancel={() => setPendingCropFile(null)}
      />
    </div>
  );
}
