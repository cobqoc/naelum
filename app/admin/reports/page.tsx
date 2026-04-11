'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TargetInfo {
  id?: string;
  title?: string;     // recipe
  username?: string;  // user
  content?: string;   // comment
  recipe_id?: string; // comment's parent recipe
}

interface Report {
  id: string;
  reporter_id: string | null;
  reported_type: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  action_taken: string | null;
  created_at: string;
  reporter: { username: string; avatar_url: string | null } | null;
  reviewer: { username: string } | null;
  target_info: TargetInfo | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기 중',
  reviewed: '검토 중',
  resolved: '처리 완료',
  dismissed: '기각',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-warning bg-warning/10',
  reviewed: 'text-info bg-info/10',
  resolved: 'text-success bg-success/10',
  dismissed: 'text-text-muted bg-white/5',
};

const REASON_LABELS: Record<string, string> = {
  spam: '스팸',
  inappropriate: '부적절한 콘텐츠',
  copyright: '저작권 침해',
  false_info: '잘못된 정보',
  harassment: '괴롭힘',
  impersonation: '사칭',
  other: '기타',
};

const TYPE_LABELS: Record<string, string> = {
  recipe: '레시피',
  user: '사용자',
  comment: '댓글',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: statusFilter,
      page: page.toString(),
      limit: '20',
    });
    const res = await fetch(`/api/admin/reports?${params}`);
    const data = await res.json();
    if (data.reports) {
      setReports(data.reports);
      setTotalPages(data.pagination?.totalPages || 1);
    }
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, [loadReports]);

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return;
    setResolving(true);
    const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, action_taken: actionTaken, resolution_note: resolveNote }),
    });
    if (res.ok) {
      setSelectedReport(null);
      setResolveNote('');
      setActionTaken('');
      loadReports();
    }
    setResolving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">신고 관리</h1>

      {/* 상태 필터 */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? 'bg-accent-warm text-background-primary'
                : 'bg-background-secondary text-text-secondary hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-text-muted">신고 내역이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-text-secondary">
                      {TYPE_LABELS[report.reported_type] || report.reported_type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-text-secondary">
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">{report.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    신고자: @{report.reporter?.username || '(탈퇴한 사용자)'}
                    {' · '}
                    {new Date(report.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <span className="text-text-muted text-sm shrink-0">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-40 hover:bg-white/10 transition-colors text-sm"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-40 hover:bg-white/10 transition-colors text-sm"
          >
            다음
          </button>
        </div>
      )}

      {/* 신고 처리 모달 */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedReport(null); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-background-secondary border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold">신고 처리</h2>

            <div className="space-y-2 text-sm text-text-secondary">
              <div>
                <span className="text-text-muted">유형: </span>
                {TYPE_LABELS[selectedReport.reported_type]}
              </div>
              <div>
                <span className="text-text-muted">사유: </span>
                {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
              </div>
              {selectedReport.description && (
                <div>
                  <span className="text-text-muted">설명: </span>
                  {selectedReport.description}
                </div>
              )}
              {/* 신고 대상 바로가기 */}
              <div>
                <span className="text-text-muted">신고 대상: </span>
                {selectedReport.reported_type === 'recipe' && selectedReport.target_info?.title ? (
                  <Link
                    href={`/recipes/${selectedReport.reported_id}`}
                    target="_blank"
                    className="text-accent-warm hover:text-accent-hover underline"
                  >
                    {selectedReport.target_info.title} →
                  </Link>
                ) : selectedReport.reported_type === 'user' && selectedReport.target_info?.username ? (
                  <Link
                    href={`/@${selectedReport.target_info.username}`}
                    target="_blank"
                    className="text-accent-warm hover:text-accent-hover underline"
                  >
                    @{selectedReport.target_info.username} →
                  </Link>
                ) : selectedReport.reported_type === 'comment' && selectedReport.target_info?.recipe_id ? (
                  <Link
                    href={`/recipes/${selectedReport.target_info.recipe_id}`}
                    target="_blank"
                    className="text-accent-warm hover:text-accent-hover underline"
                  >
                    댓글 원문 보기 →
                  </Link>
                ) : (
                  <code className="text-xs bg-background-tertiary px-1 rounded">{selectedReport.reported_id.slice(0, 16)}…</code>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-muted mb-1">조치 내용</label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="예: 경고 발송, 게시물 삭제, 계정 차단 등"
                className="w-full rounded-lg bg-background-tertiary border border-white/10 px-3 py-2 text-sm outline-none focus:border-accent-warm"
              />
            </div>

            <div>
              <label className="block text-sm text-text-muted mb-1">처리 메모</label>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                rows={3}
                placeholder="내부 처리 메모를 입력하세요"
                className="w-full rounded-lg bg-background-tertiary border border-white/10 px-3 py-2 text-sm outline-none focus:border-accent-warm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResolve('resolved')}
                disabled={resolving}
                className="flex-1 py-2.5 rounded-xl bg-success text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                처리 완료
              </button>
              <button
                onClick={() => handleResolve('dismissed')}
                disabled={resolving}
                className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-secondary font-medium text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                기각
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2.5 rounded-xl bg-background-tertiary text-text-muted text-sm hover:bg-white/10 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
