'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useParams } from 'next/navigation';
import Link from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import ImageCropModal from '@/components/Common/ImageCropModal';
import { useTipForm } from '../../_components/useTipForm';
import TipFormFields from '../../_components/TipFormFields';

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
 *
 * 2026-10-04 PAU-27: tip/new 와 똑같이 복제돼 있던 폼 상태·핸들러(useTipForm)·필드 JSX(TipFormFields)를
 * ../../_components 로 공용화. 이 페이지 고유 부분(로드·작성자 검사·draft 발행·PUT 저장)만 남음.
 */

interface LoadedTip {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  duration_minutes?: number | null;
  thumbnail_url?: string | null;
  is_public: boolean;
  is_draft?: boolean;
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

  // 폼 state — 초기값은 load 후 채움. tip/new 와 공용 훅 (PAU-27)
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isPublicRef = useRef(true);
  // 편집 진입 시점의 draft 여부 — draft 팁을 "수정 완료" 하면 발행(is_draft=false)해야 함(H16)
  const wasDraftRef = useRef(false);

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
        setCategory(tip.category || '');
        setDurationMinutes(tip.duration_minutes != null ? String(tip.duration_minutes) : '');
        setThumbnail(tip.thumbnail_url || null);
        isPublicRef.current = tip.is_public;
        wasDraftRef.current = tip.is_draft === true;
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
    // setX 는 useTipForm 이 돌려주는 useState setter(안정 참조) — 예전처럼 페이지 안에 선언돼 있을 땐 lint 가 생략을
    // 허용했지만 훅 반환값이 되면서 명시. 값이 바뀌지 않으므로 effect 재실행 조건은 그대로 (PAU-27).
  }, [id, router, supabase, t.tipForm.editLoadError, setTitle, setDescription, setCategory, setDurationMinutes, setThumbnail, setSteps, setTags]);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError(t.tipForm.errorTitleRequired); return; }
    if (title.length > 200) { setError(t.common.errorTitleTooLong); return; }
    if (description.length > 500) { setError(t.common.errorDescriptionTooLong); return; }
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
          // "수정 완료"는 완성된 팁(단계 검증 통과) → 발행. draft 였으면 공개로 발행(H16),
          // 이미 발행된 팁은 기존 공개 상태 보존.
          is_draft: false,
          is_public: wasDraftRef.current ? true : isPublicRef.current,
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
          {/* 썸네일·제목·카테고리·소요시간·설명·단계·태그·에러 — tip/new 와 공용 (PAU-27). alt="thumbnail" 은 기존 값 보존 */}
          <TipFormFields t={t} form={form} thumbnailAlt="thumbnail" error={error} />

          {/* 저장 */}
          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? t.tipForm.editSaving : t.tipForm.editSubmit}
          </button>
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
