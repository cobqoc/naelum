'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import dynamic from 'next/dynamic';
import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';

const ReportModal = dynamic(() => import('@/components/Common/ReportModal'), { ssr: false });
const ConfirmDialog = dynamic(() => import('@/components/Common/ConfirmDialog'), { ssr: false });

// 2026-05-25 한글 → 영문 key 마이그레이션. 표시는 t.tipForm.categories[key].
const CATEGORY_ICONS: Record<string, string> = {
  prep: '🔪', storage: '🧊', cooking: '🍳', tools: '🥄', measuring: '⚖️', other: '💡',
};

interface TipStep {
  id: string;
  step_number: number;
  instruction: string;
  tip?: string | null;
  image_url?: string | null;
}

interface Tip {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category: string;
  duration_minutes?: number | null;
  views_count: number;
  created_at: string;
  author: { username: string; avatar_url?: string | null };
  steps: TipStep[];
  tags: string[];
  author_id: string;
}

export default function TipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const { t, language } = useI18n();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [res, { data: { user } }] = await Promise.all([
        fetch(`/api/tip/${id}`),
        supabase.auth.getUser(),
      ]);
      const data = await res.json();
      if (res.ok) setTip(data.tip);
      if (user) setCurrentUserId(user.id);
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    setDeleting(true);
    const res = await fetch(`/api/tip/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/');
    else setDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">{t.tip.detailNotFound}</p>
        <Link href="/" className="text-accent-warm hover:underline">{t.tip.detailGoHome}</Link>
      </div>
    );
  }

  const isAuthor = currentUserId === tip.author_id;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
        {/* 뒤로가기 */}
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary transition-colors mb-6 flex items-center gap-2 text-sm">
          ← {t.common.back}
        </button>

        {/* 썸네일 */}
        {tip.thumbnail_url && (
          <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-6">
            <SafeImage src={tip.thumbnail_url} alt={tip.title} fill className="object-cover" />
          </div>
        )}

        {/* 헤더 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium">
              {CATEGORY_ICONS[tip.category]} {t.tipForm.categories[tip.category as keyof typeof t.tipForm.categories] ?? tip.category}
            </span>
            {tip.duration_minutes && (
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-muted text-xs">
                ⏱ {tip.duration_minutes}{t.tip.detailMinuteSuffix}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-3">{tip.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>@{tip.author?.username}</span>
              <span>·</span>
              <span>{new Date(tip.created_at).toLocaleDateString(language)}</span>
              <span>·</span>
              <span>👁 {tip.views_count}</span>
            </div>
            <div className="flex gap-3 items-center">
              {isAuthor ? (
                <>
                  <Link
                    href={`/tip/${id}/edit`}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    {t.tip.detailEdit}
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmOpen(true)} disabled={deleting}
                    className="text-xs text-error hover:underline disabled:opacity-50"
                  >
                    {deleting ? t.tip.detailDeleting : t.common.delete}
                  </button>
                </>
              ) : currentUserId ? (
                <button
                  onClick={() => setReportOpen(true)}
                  aria-label={t.report.menuLabel}
                  title={t.report.menuLabel}
                  className="text-text-muted hover:text-text-primary text-sm"
                >
                  🚨
                </button>
              ) : null}
            </div>
          </div>

          {tip.description && (
            <p className="mt-4 text-text-secondary text-sm leading-relaxed">{tip.description}</p>
          )}
        </div>

        {/* 단계 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold">{t.tip.detailStepsTitle}</h2>
          {tip.steps.map((step) => (
            <div key={step.id} className="bg-background-secondary rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-accent-warm text-background-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step.step_number}
                </span>
                <span className="text-sm font-medium text-accent-warm">Step {step.step_number}</span>
              </div>

              {step.image_url && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3">
                  <SafeImage src={step.image_url} alt={`step ${step.step_number}`} fill className="object-cover" />
                </div>
              )}

              <p className="text-text-primary leading-relaxed">{step.instruction}</p>

              {step.tip && (
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-accent-warm/5 border border-accent-warm/20 text-sm text-accent-warm">
                  💡 {step.tip}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 태그 */}
        {tip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tip.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-sm">#{tag}</span>
            ))}
          </div>
        )}
      </main>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="tip"
        contentId={tip.id}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={t.tip.detailDeleteConfirm}
        confirmLabel={t.common.delete}
        destructive
        loading={deleting}
        loadingLabel={t.tip.detailDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
