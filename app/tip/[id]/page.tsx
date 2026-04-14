'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/Common/SafeImage';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

const CATEGORY_ICONS: Record<string, string> = {
  '손질법': '🔪', '보관법': '🧊', '조리법': '🍳',
  '도구 사용법': '🥄', '계량법': '⚖️', '기타': '💡',
};

interface KnowhowStep {
  id: string;
  step_number: number;
  instruction: string;
  tip?: string | null;
  image_url?: string | null;
}

interface Knowhow {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category: string;
  duration_minutes?: number | null;
  views_count: number;
  created_at: string;
  author: { username: string; avatar_url?: string | null };
  steps: KnowhowStep[];
  tags: string[];
  author_id: string;
}

export default function TipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [knowhow, setKnowhow] = useState<Knowhow | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [res, { data: { user } }] = await Promise.all([
        fetch(`/api/tip/${id}`),
        supabase.auth.getUser(),
      ]);
      const data = await res.json();
      if (res.ok) setKnowhow(data.tip);
      if (user) setCurrentUserId(user.id);
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const handleDelete = async () => {
    if (!confirm('팁을 삭제하시겠습니까?')) return;
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

  if (!knowhow) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">팁을 찾을 수 없습니다.</p>
        <Link href="/" className="text-accent-warm hover:underline">홈으로</Link>
      </div>
    );
  }

  const isAuthor = currentUserId === knowhow.author_id;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
        {/* 뒤로가기 */}
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary transition-colors mb-6 flex items-center gap-2 text-sm">
          ← 뒤로
        </button>

        {/* 썸네일 */}
        {knowhow.thumbnail_url && (
          <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-6">
            <SafeImage src={knowhow.thumbnail_url} alt={knowhow.title} fill className="object-cover" />
          </div>
        )}

        {/* 헤더 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium">
              {CATEGORY_ICONS[knowhow.category]} {knowhow.category}
            </span>
            {knowhow.duration_minutes && (
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-muted text-xs">
                ⏱ {knowhow.duration_minutes}분
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-3">{knowhow.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>@{knowhow.author?.username}</span>
              <span>·</span>
              <span>{new Date(knowhow.created_at).toLocaleDateString('ko-KR')}</span>
              <span>·</span>
              <span>👁 {knowhow.views_count}</span>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete} disabled={deleting}
                  className="text-xs text-error hover:underline disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            )}
          </div>

          {knowhow.description && (
            <p className="mt-4 text-text-secondary text-sm leading-relaxed">{knowhow.description}</p>
          )}
        </div>

        {/* 단계 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold">단계별 가이드</h2>
          {knowhow.steps.map((step) => (
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
        {knowhow.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {knowhow.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-sm">#{tag}</span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
