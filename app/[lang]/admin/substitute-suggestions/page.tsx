'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import ConfirmDialog from '@/components/Common/ConfirmDialog';

type Kind = 'substitute' | 'preparable_to';

interface SuggestionRow {
  from_name: string;
  to_name: string;
  from_id: string | null;
  to_id: string | null;
  count: number;
  status: 'new' | 'promoted';
}

interface PromotedRow {
  from_id: string;
  to_id: string;
  from_name: string;
  to_name: string;
  kind: Kind;
  source: string;
  suggestion_count: number;
  approved_at: string;
}

const STATUS_LABELS: Record<SuggestionRow['status'], string> = {
  new: '미검토',
  promoted: '승급됨',
};

const STATUS_COLORS: Record<SuggestionRow['status'], string> = {
  new: 'text-warning bg-warning/10',
  promoted: 'text-success bg-success/10',
};

const KIND_LABELS: Record<Kind, string> = {
  substitute: '대체 (양방향)',
  preparable_to: '가공 (단방향)',
};

/**
 * V2 어드민 매칭 관계 관리 페이지 (2026-05-29).
 *
 * 작성자가 적은 substitutes 후보를 검토 → kind 선택 (substitute/preparable_to) → ingredient_relations INSERT.
 * 양방향 (substitute) 은 DB trigger 로 reverse row 자동 생성.
 */
export default function AdminRelationsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [promoted, setPromoted] = useState<PromotedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionRow['status']>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<SuggestionRow | null>(null);
  const [approveKind, setApproveKind] = useState<Kind>('substitute');
  const [pendingRevoke, setPendingRevoke] = useState<PromotedRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/substitute-suggestions');
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions ?? []);
        setPromoted(data.promoted ?? []);
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    if (!approveTarget.from_id || !approveTarget.to_id) {
      toast.error('양쪽 재료 모두 ingredients_master 에 등록되어야 승급 가능합니다');
      return;
    }
    const key = `${approveTarget.from_id}|${approveTarget.to_id}`;
    setBusy(key);
    try {
      const res = await fetch('/api/admin/substitute-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_id: approveTarget.from_id,
          to_id: approveTarget.to_id,
          kind: approveKind,
          suggestion_count: approveTarget.count,
          source: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);
      toast.success('승급 완료');
      setApproveTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusy(null);
    }
  };

  const handleRevoke = async (row: PromotedRow) => {
    const key = `${row.from_id}|${row.to_id}|${row.kind}`;
    setBusy(key);
    try {
      const params = new URLSearchParams({ from: row.from_id, to: row.to_id, kind: row.kind });
      const res = await fetch(`/api/admin/substitute-suggestions?${params.toString()}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.common.error);
      }
      toast.success('관계 제거 완료');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusy(null);
      setPendingRevoke(null);
    }
  };

  const filtered = statusFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.status === statusFilter);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">매칭 관계 관리</h1>
        <p className="text-sm text-text-secondary">
          작성자가 입력한 대체 재료 후보를 검토하고 ingredient_relations 그래프에 승급합니다.
          승급된 관계만 매칭에 사용됩니다 (V2 — 코드 상수·이름 매칭·정규화 0).
        </p>
      </div>

      {/* 후보 누적 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">작성자 substitutes 후보</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | SuggestionRow['status'])}
            className="px-3 py-1 rounded-lg bg-background-secondary border border-white/10 text-sm"
          >
            <option value="all">전체</option>
            <option value="new">미검토</option>
            <option value="promoted">승급됨</option>
          </select>
        </div>

        {loading ? (
          <p className="text-text-muted">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-muted">후보 없음 — 작성자가 substitutes 를 입력하면 표시됩니다.</p>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary text-text-secondary">
                <tr>
                  <th className="px-4 py-2 text-left">from → to</th>
                  <th className="px-4 py-2 text-center">건수</th>
                  <th className="px-4 py-2 text-center">매핑</th>
                  <th className="px-4 py-2 text-center">상태</th>
                  <th className="px-4 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const key = `${row.from_name}|${row.to_name}`;
                  const canApprove = row.status === 'new' && row.from_id && row.to_id;
                  return (
                    <tr key={key} className="border-t border-white/5">
                      <td className="px-4 py-2">
                        <span className="font-medium">{row.from_name}</span>
                        <span className="text-text-muted mx-2">→</span>
                        <span className="font-medium">{row.to_name}</span>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{row.count}</td>
                      <td className="px-4 py-2 text-center text-xs">
                        <span className={row.from_id ? 'text-success' : 'text-error'}>from {row.from_id ? '✓' : '✗'}</span>
                        <span className="mx-1 text-text-muted">|</span>
                        <span className={row.to_id ? 'text-success' : 'text-error'}>to {row.to_id ? '✓' : '✗'}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {canApprove ? (
                          <button
                            type="button"
                            onClick={() => {
                              setApproveTarget(row);
                              setApproveKind('substitute');
                            }}
                            disabled={busy !== null}
                            className="px-3 py-1 rounded-lg bg-accent-warm/10 text-accent-warm border border-accent-warm/30 hover:bg-accent-warm/20 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            승급
                          </button>
                        ) : !row.from_id || !row.to_id ? (
                          <span className="text-xs text-text-muted">재료 미등록</span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 승급된 관계 */}
      <section>
        <h2 className="text-lg font-bold mb-3">승급된 ingredient_relations</h2>
        {promoted.length === 0 ? (
          <p className="text-text-muted">승급된 관계 없음.</p>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary text-text-secondary">
                <tr>
                  <th className="px-4 py-2 text-left">from → to</th>
                  <th className="px-4 py-2 text-center">종류</th>
                  <th className="px-4 py-2 text-center">출처</th>
                  <th className="px-4 py-2 text-center">승급일</th>
                  <th className="px-4 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {promoted.map((row) => (
                  <tr key={`${row.from_id}|${row.to_id}|${row.kind}`} className="border-t border-white/5">
                    <td className="px-4 py-2">
                      <span className="font-medium">{row.from_name}</span>
                      <span className="text-text-muted mx-2">→</span>
                      <span className="font-medium">{row.to_name}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        row.kind === 'substitute' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                      }`}>
                        {KIND_LABELS[row.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-text-muted">{row.source}</td>
                    <td className="px-4 py-2 text-center text-xs text-text-muted">
                      {new Date(row.approved_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPendingRevoke(row)}
                        disabled={busy !== null}
                        className="px-3 py-1 rounded-lg bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        제거
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 승급 모달 — kind 선택 */}
      {approveTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setApproveTarget(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl bg-background-primary border border-white/10 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">관계 승급</h3>
            <p className="text-sm text-text-secondary mb-4">
              <span className="font-medium">{approveTarget.from_name}</span> →{' '}
              <span className="font-medium">{approveTarget.to_name}</span> 관계를 어떻게 처리할까요?
            </p>

            <div className="space-y-2 mb-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:border-info/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="kind"
                  value="substitute"
                  checked={approveKind === 'substitute'}
                  onChange={() => setApproveKind('substitute')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">대체 (양방향)</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    A ↔ B 서로 바꿔 쓸 수 있음. 액젓끼리, 파프리카↔피망 등.
                    <br />DB trigger 로 reverse row 자동 생성.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:border-warning/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="kind"
                  value="preparable_to"
                  checked={approveKind === 'preparable_to'}
                  onChange={() => setApproveKind('preparable_to')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">가공 (단방향)</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    A → B 만 가능 (원형→가공). 통마늘→다진마늘, 쌀→밥 등.
                    <br />역방향은 매칭 안 됨 (다진마늘로 통마늘 못 만듦).
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                disabled={busy !== null}
                className="flex-1 px-4 py-2 rounded-xl bg-background-secondary text-text-secondary hover:bg-white/10 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={busy !== null}
                className="flex-1 px-4 py-2 rounded-xl bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {busy !== null ? '처리 중…' : '승급'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제거 확인 */}
      <ConfirmDialog
        isOpen={pendingRevoke !== null}
        onCancel={() => setPendingRevoke(null)}
        onConfirm={() => pendingRevoke && handleRevoke(pendingRevoke)}
        title="매칭 관계 제거"
        description={
          pendingRevoke
            ? `${pendingRevoke.from_name} → ${pendingRevoke.to_name} (${KIND_LABELS[pendingRevoke.kind]}) 관계를 제거합니다.`
            : ''
        }
        confirmLabel="제거"
        cancelLabel={t.common.cancel}
        destructive
      />
    </div>
  );
}
