'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket, getPublicUrl } from '@/lib/storage';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { useAutosave, loadAutosave, clearAutosave } from '@/lib/hooks/useAutosave';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

const CATEGORIES = ['손질법', '보관법', '조리법', '도구 사용법', '계량법', '기타'];
const CATEGORY_ICONS: Record<string, string> = {
  '손질법': '🔪', '보관법': '🧊', '조리법': '🍳',
  '도구 사용법': '🥄', '계량법': '⚖️', '기타': '💡',
};

interface Step {
  instruction: string;
  tip: string;
  image_url: string | null;
  uploading: boolean;
}

export default function TipNewPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('기타');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([{ instruction: '', tip: '', image_url: null, uploading: false }]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // 저장 진행 상태 — 3개 액션(임시저장/비공개/공개) 중 무엇이 진행 중인지.
  const [pending, setPending] = useState<'draft' | 'private' | 'public' | null>(null);
  const [error, setError] = useState('');

  // 자동저장 — localStorage 백업 (게시·임시저장 시 clear)
  const AUTOSAVE_KEY = 'naelum_tip_new_autosave_v1';
  const AUTOSAVE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const [autosaveRestoreVisible, setAutosaveRestoreVisible] = useState(false);
  type AutosaveSnapshot = {
    title: string; description: string; category: string;
    durationMinutes: string;
    thumbnail: string | null;
    steps: Step[]; tags: string[];
  };
  const autosaveSnapshotRef = useRef<AutosaveSnapshot | null>(null);

  const autosaveData = useMemo<AutosaveSnapshot>(() => ({
    title, description, category, durationMinutes, thumbnail,
    steps, tags,
  }), [title, description, category, durationMinutes, thumbnail, steps, tags]);

  useAutosave(AUTOSAVE_KEY, autosaveData, { enabled: !autosaveRestoreVisible });

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
    setCategory(s.category || '기타');
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

  // 썸네일 업로드
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }

    setThumbnailUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-thumb-${Date.now()}.${ext}`;
    const { path, error } = await uploadToBucket(supabase, 'recipe-images', fileName, file, { cacheControl: '3600', upsert: false });
    if (!error && path) {
      setThumbnail(getPublicUrl(supabase, 'recipe-images', path));
    }
    setThumbnailUploading(false);
  };

  // 단계 이미지 업로드
  const handleStepImageUpload = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }

    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: true } : s));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-step-${Date.now()}-${idx}.${ext}`;
    const { path, error } = await uploadToBucket(supabase, 'recipe-images', fileName, file, { cacheControl: '3600', upsert: false });
    if (!error && path) {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: getPublicUrl(supabase, 'recipe-images', path), uploading: false } : s));
    } else {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: false } : s));
    }
  };

  const addStep = () => setSteps(prev => [...prev, { instruction: '', tip: '', image_url: null, uploading: false }]);
  const removeStep = (idx: number) => {
    if (steps.length === 1) return;
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };
  const updateStep = (idx: number, field: keyof Step, value: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addTag = useCallback(() => {
    const tagText = tagInput.trim();
    if (tagText && !tags.includes(tagText) && tags.length < 10) {
      setTags(prev => [...prev, tagText]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // 공개/비공개 저장 — 둘 다 완성된 팁(is_draft=false). is_public 만 다름.
  const handleSubmit = async (isPublic: boolean) => {
    setError('');
    if (!title.trim()) { setError(t.tipForm.errorTitleRequired); return; }
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
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = user
          ? await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
          : { data: null };
        router.push(profile?.username ? `/@${profile.username}?tab=private` : '/');
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
      if (!res.ok) { setError(data.error || t.tipForm.errorGeneric); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      clearAutosave(AUTOSAVE_KEY);
      router.push(profile?.username ? `/@${profile.username}?tab=drafts` : '/');
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
          {/* 썸네일 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.thumbnailLabel}</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-background-secondary border border-white/10 flex items-center justify-center hover:border-accent-warm/40 transition-colors">
                {thumbnail ? (
                  <Image src={thumbnail} alt="썸네일" fill className="object-cover" />
                ) : thumbnailUploading ? (
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
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
    </div>
  );
}
