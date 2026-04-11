'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('기타');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([{ instruction: '', tip: '', image_url: null, uploading: false }]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftSubmitting, setDraftSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 썸네일 업로드
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('이미지는 5MB 이하여야 합니다.'); return; }

    setThumbnailUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-thumb-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('recipe-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(data.path);
      setThumbnail(urlData.publicUrl);
    }
    setThumbnailUploading(false);
  };

  // 단계 이미지 업로드
  const handleStepImageUpload = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('이미지는 5MB 이하여야 합니다.'); return; }

    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, uploading: true } : s));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/knowhow-step-${Date.now()}-${idx}.${ext}`;
    const { data, error } = await supabase.storage.from('recipe-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(data.path);
      setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: urlData.publicUrl, uploading: false } : s));
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
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (steps.some(s => !s.instruction.trim())) { setError('모든 단계에 지시사항을 입력해주세요.'); return; }

    setSubmitting(true);
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
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      router.push(`/tip/${data.tip.id}`);
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = async () => {
    setError('');
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    setDraftSubmitting(true);
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
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user!.id).single();
      router.push(`/@${profile?.username}?tab=drafts`);
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setDraftSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">←</Link>
          <h1 className="text-2xl font-bold">💡 팁 작성</h1>
        </div>

        <div className="space-y-6">
          {/* 썸네일 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">대표 이미지 (선택)</label>
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
                    <p className="text-sm">클릭하여 이미지 업로드</p>
                  </div>
                )}
              </div>
            </label>
            {thumbnail && (
              <button onClick={() => setThumbnail(null)} className="mt-2 text-xs text-error hover:underline">이미지 제거</button>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">제목 *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="예: 마늘 빠르게 손질하는 법"
              maxLength={200}
              className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-accent-warm/50 transition-colors"
            />
          </div>

          {/* 카테고리 + 소요시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">카테고리</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-accent-warm/50 transition-colors cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">소요시간 (분)</label>
              <input
                type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)}
                placeholder="예: 10"
                min={1} max={999}
                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-accent-warm/50 transition-colors"
              />
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">설명 (선택)</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="어떤 팁인지 간단히 설명해주세요."
              rows={3}
              className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-accent-warm/50 transition-colors resize-none"
            />
          </div>

          {/* 단계 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">단계 *</label>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-background-secondary rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-accent-warm">Step {idx + 1}</span>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(idx)} className="text-xs text-text-muted hover:text-error transition-colors">삭제</button>
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
                        <span className="text-text-muted text-sm">📷 이미지 추가 (선택)</span>
                      )}
                    </div>
                  </label>
                  {step.image_url && (
                    <button onClick={() => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: null } : s))} className="text-xs text-error hover:underline mb-2 block">이미지 제거</button>
                  )}

                  {/* 지시사항 */}
                  <textarea
                    value={step.instruction}
                    onChange={e => updateStep(idx, 'instruction', e.target.value)}
                    placeholder="이 단계에서 할 일을 설명해주세요."
                    rows={2}
                    className="w-full bg-background-tertiary border border-white/5 rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-warm/40 transition-colors resize-none mb-2"
                  />

                  {/* 팁 */}
                  <input
                    type="text" value={step.tip}
                    onChange={e => updateStep(idx, 'tip', e.target.value)}
                    placeholder="💡 이 단계의 팁 (선택)"
                    className="w-full bg-background-tertiary border border-white/5 rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-warm/40 transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-3 w-full py-3 rounded-xl border border-dashed border-white/20 text-text-muted hover:border-accent-warm/40 hover:text-accent-warm transition-colors text-sm"
            >
              + 단계 추가
            </button>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">태그 (선택, 최대 10개)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="태그 입력 후 Enter"
                className="flex-1 bg-background-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-warm/50 transition-colors"
              />
              <button onClick={addTag} className="px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-sm hover:border-accent-warm/40 transition-colors">추가</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-sm">
                    #{tag}
                    <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="hover:text-error ml-1">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background-secondary border border-white/10">
            <span className="text-sm">공개 여부</span>
            <button
              type="button" onClick={() => setIsPublic(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${isPublic ? 'bg-accent-warm' : 'bg-background-tertiary'}`}
              role="switch" aria-checked={isPublic}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}

          {/* 제출 */}
          <div className="flex gap-3">
            <button
              onClick={handleDraft} disabled={draftSubmitting || submitting}
              className="flex-1 py-4 rounded-xl bg-background-secondary border border-white/10 text-text-secondary font-bold hover:bg-background-tertiary transition-colors disabled:opacity-50"
            >
              {draftSubmitting ? '저장 중...' : '임시저장'}
            </button>
            <button
              onClick={handleSubmit} disabled={submitting || draftSubmitting}
              className="flex-[2] py-4 rounded-xl bg-accent-warm text-background-primary font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting ? '업로드 중...' : '팁 공유하기'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
