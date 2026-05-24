'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useParams } from 'next/navigation';
import Link from '@/components/Common/LocalizedLink';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket, getPublicUrl } from '@/lib/storage';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

/**
 * 팁 수정 페이지 — /tip/[id]/edit
 *
 * tip/new 미러 구조 + edit 전용 차이:
 *  - GET /api/tip/[id] 로 기존 데이터 load → 폼 초기화
 *  - 작성자 본인만 접근 (currentUser !== author_id → redirect)
 *  - 단일 "수정 완료" 버튼 (3-button 패턴 X — 임시저장은 신규 작성만)
 *  - autosave 미적용 — 편집 중인 기존 팁을 우연한 새로고침으로 덮어쓰는 위험 차단
 *  - PUT /api/tip/[id] 로 저장 (is_public 토글 미노출 — 기존 상태 보존)
 *
 * 한글/일본어/중국어 IME 가드 — tag input Enter 핸들러 (tip/new 와 동일).
 */

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

interface LoadedTip {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  duration_minutes?: number | null;
  thumbnail_url?: string | null;
  is_public: boolean;
  author_id: string;
  steps: Array<{ step_number: number; instruction: string; tip?: string | null; image_url?: string | null }>;
  tags: string[];
}

export default function TipEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 폼 state — 초기값은 load 후 채움.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('기타');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([{ instruction: '', tip: '', image_url: null, uploading: false }]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isPublicRef = useRef(true);

  const tagComposingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tipRes, { data: { user } }] = await Promise.all([
          fetch(`/api/tip/${id}`),
          supabase.auth.getUser(),
        ]);
        if (!tipRes.ok) {
          setLoadError(t.tipForm.editLoadError);
          setLoading(false);
          return;
        }
        const body = await tipRes.json();
        const tip = body.tip as LoadedTip;
        // 작성자 본인만 — 다른 사용자가 URL 직접 접근 시 상세 페이지로 redirect.
        if (!user || user.id !== tip.author_id) {
          router.replace(`/tip/${id}`);
          return;
        }
        setTitle(tip.title || '');
        setDescription(tip.description || '');
        setCategory(tip.category || '기타');
        setDurationMinutes(tip.duration_minutes != null ? String(tip.duration_minutes) : '');
        setThumbnail(tip.thumbnail_url || null);
        isPublicRef.current = tip.is_public;
        if (Array.isArray(tip.steps) && tip.steps.length > 0) {
          setSteps(
            tip.steps
              .sort((a, b) => a.step_number - b.step_number)
              .map(s => ({
                instruction: s.instruction || '',
                tip: s.tip || '',
                image_url: s.image_url || null,
                uploading: false,
              })),
          );
        }
        if (Array.isArray(tip.tags)) setTags(tip.tags);
      } catch {
        setLoadError(t.tipForm.editLoadError);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router, supabase, t.tipForm.editLoadError]);

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }
    setThumbnailUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setThumbnailUploading(false); return; }
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-thumb-${Date.now()}.${ext}`;
    const { path, error: upErr } = await uploadToBucket(supabase, 'recipe-images', fileName, file, { cacheControl: '3600', upsert: false });
    if (!upErr && path) {
      setThumbnail(getPublicUrl(supabase, 'recipe-images', path));
    } else {
      toast.error(t.tipForm.errorGeneric);
    }
    setThumbnailUploading(false);
  };

  const handleStepImageUpload = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.tipForm.errorImageSize); return; }
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: true } : s));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: false } : s));
      return;
    }
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-step-${Date.now()}-${idx}.${ext}`;
    const { path, error: upErr } = await uploadToBucket(supabase, 'recipe-images', fileName, file, { cacheControl: '3600', upsert: false });
    if (!upErr && path) {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: getPublicUrl(supabase, 'recipe-images', path), uploading: false } : s));
    } else {
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: false } : s));
      toast.error(t.tipForm.errorGeneric);
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

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError(t.tipForm.errorTitleRequired); return; }
    if (steps.some(s => !s.instruction.trim())) { setError(t.tipForm.errorStepRequired); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/tip/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          thumbnail_url: thumbnail,
          category,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          is_public: isPublicRef.current,
          steps: steps.map(({ instruction, tip, image_url }) => ({ instruction, tip, image_url })),
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.tipForm.errorGeneric); return; }
      router.push(`/tip/${id}`);
    } catch {
      setError(t.tipForm.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">{loadError}</p>
        <Link href="/" className="text-accent-warm hover:underline">{t.tip.detailGoHome}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/tip/${id}`} className="text-text-muted hover:text-text-primary transition-colors">←</Link>
          <h1 className="text-2xl font-bold">{t.tipForm.editPageTitle}</h1>
        </div>

        <div className="space-y-6">
          {/* 썸네일 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t.tipForm.thumbnailLabel}</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-background-secondary border border-white/10 flex items-center justify-center hover:border-accent-warm/40 transition-colors">
                {thumbnail ? (
                  <Image src={thumbnail} alt="thumbnail" fill className="object-cover" />
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

          {/* 저장 */}
          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? t.tipForm.editSaving : t.tipForm.editSubmit}
          </button>
        </div>
      </main>
    </div>
  );
}
