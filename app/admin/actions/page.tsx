'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminAction {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin: { username: string; avatar_url: string | null } | null;
}

const ACTION_LABELS: Record<string, string> = {
  ban_user: '사용자 차단',
  unban_user: '차단 해제',
  delete_user: '사용자 삭제',
  delete_recipe: '레시피 삭제',
  publish_recipe: '레시피 공개',
  unpublish_recipe: '레시피 비공개',
  resolve_report: '신고 처리',
  change_role: '권한 변경',
};

const ACTION_COLORS: Record<string, string> = {
  ban_user: 'text-error bg-error/10',
  unban_user: 'text-success bg-success/10',
  delete_user: 'text-error bg-error/10',
  delete_recipe: 'text-warning bg-warning/10',
  publish_recipe: 'text-success bg-success/10',
  unpublish_recipe: 'text-warning bg-warning/10',
  resolve_report: 'text-info bg-info/10',
  change_role: 'text-accent-warm bg-accent-warm/10',
};

const ACTION_TYPES = Object.keys(ACTION_LABELS);

export default function AdminActionsPage() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      ...(actionTypeFilter && { action_type: actionTypeFilter }),
    });
    const res = await fetch(`/api/admin/actions?${params}`);
    const data = await res.json();
    if (data.actions) {
      setActions(data.actions);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    }
    setLoading(false);
  }, [page, actionTypeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActions();
  }, [loadActions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">관리자 감사 로그</h1>
          <p className="text-sm text-text-muted mt-1">총 {total.toLocaleString()}건의 관리 기록</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setActionTypeFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            actionTypeFilter === ''
              ? 'bg-accent-warm text-background-primary'
              : 'bg-background-secondary text-text-secondary hover:bg-white/10'
          }`}
        >
          전체
        </button>
        {ACTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => { setActionTypeFilter(type); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              actionTypeFilter === type
                ? 'bg-accent-warm text-background-primary'
                : 'bg-background-secondary text-text-secondary hover:bg-white/10'
            }`}
          >
            {ACTION_LABELS[type]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16 text-text-muted">기록이 없습니다.</div>
      ) : (
        <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">날짜</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">관리자</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">액션</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">대상</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">IP</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">상세</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <>
                    <tr
                      key={action.id}
                      className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                    >
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(action.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        @{action.admin?.username || '(알 수 없음)'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[action.action_type] || 'text-text-muted bg-white/10'}`}>
                          {ACTION_LABELS[action.action_type] || action.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <span className="text-xs">{action.target_type}</span>
                        <br />
                        <code className="text-xs opacity-60">{action.target_id.slice(0, 8)}…</code>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {action.ip_address || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {action.details ? '▼ 보기' : '—'}
                      </td>
                    </tr>
                    {expandedId === action.id && action.details && (
                      <tr key={`${action.id}-detail`} className="border-t border-white/5 bg-background-tertiary">
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(action.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
