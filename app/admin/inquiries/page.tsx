'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Inquiry {
  id: string;
  user_id: string | null;
  email: string | null;
  category: 'bug' | 'feature' | 'other';
  content: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  bug:     { label: '버그 신고', icon: '🐛', color: 'bg-error/20 text-error' },
  feature: { label: '기능 제안', icon: '💡', color: 'bg-info/20 text-info' },
  other:   { label: '기타',     icon: '💬', color: 'bg-white/10 text-text-muted' },
};

const STATUS_LABELS: Record<string, { label: string; next: string; color: string }> = {
  pending:     { label: '미처리',   next: 'in_progress', color: 'bg-warning/20 text-warning' },
  in_progress: { label: '처리 중',  next: 'resolved',    color: 'bg-info/20 text-info' },
  resolved:    { label: '완료',     next: 'pending',     color: 'bg-success/20 text-success' },
};

type FilterCategory = 'all' | 'bug' | 'feature' | 'other';

export default function AdminInquiriesPage() {
  const supabase = createClient();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    const query = supabase
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    const { data } = await query;
    setInquiries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      const { data } = await query;
      if (!cancelled) {
        setInquiries(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase
      .from('contact_inquiries')
      .update({ status: newStatus })
      .eq('id', id);
    setInquiries(prev =>
      prev.map(i => i.id === id ? { ...i, status: newStatus as Inquiry['status'] } : i)
    );
  };

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.category === filter);
  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  const FILTER_TABS: { key: FilterCategory; label: string; icon: string }[] = [
    { key: 'all',     label: '전체',     icon: '📋' },
    { key: 'bug',     label: '버그 신고', icon: '🐛' },
    { key: 'feature', label: '기능 제안', icon: '💡' },
    { key: 'other',   label: '기타',     icon: '💬' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">✉️ 문의 관리</h1>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold">
              미처리 {pendingCount}건
            </span>
          )}
        </div>
        <button
          onClick={loadInquiries}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-accent-warm text-background-primary'
                : 'bg-background-secondary text-text-muted hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key !== 'all' && (
              <span className="text-xs opacity-70">
                {inquiries.filter(i => i.category === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-text-muted">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-text-muted">문의 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inquiry => {
            const cat = CATEGORY_LABELS[inquiry.category];
            const st = STATUS_LABELS[inquiry.status];
            const isExpanded = expandedId === inquiry.id;

            return (
              <div
                key={inquiry.id}
                className="rounded-2xl bg-background-secondary border border-white/5 overflow-hidden"
              >
                {/* 요약 행 */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                >
                  {/* 카테고리 배지 */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${cat.color}`}>
                    {cat.icon} {cat.label}
                  </span>

                  {/* 내용 미리보기 */}
                  <p className="flex-1 text-sm text-text-primary truncate min-w-0">
                    {inquiry.content}
                  </p>

                  {/* 이메일 */}
                  <span className="text-xs text-text-muted flex-shrink-0 hidden sm:block">
                    {inquiry.email || '—'}
                  </span>

                  {/* 날짜 */}
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                  </span>

                  {/* 상태 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(inquiry.id, st.next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 transition-all hover:opacity-80 ${st.color}`}
                    title="클릭해서 상태 변경"
                  >
                    {st.label}
                  </button>

                  <span className="text-text-muted text-xs flex-shrink-0">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* 펼쳐진 내용 */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4">
                    <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                      {inquiry.content}
                    </p>
                    {inquiry.email && (
                      <p className="mt-3 text-xs text-text-muted">
                        이메일: <a href={`mailto:${inquiry.email}`} className="text-accent-warm hover:underline">{inquiry.email}</a>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      접수일: {new Date(inquiry.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
