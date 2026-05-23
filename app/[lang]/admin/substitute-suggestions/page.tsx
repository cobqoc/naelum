'use client';

import { useEffect, useState, useCallback } from 'react';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

interface SuggestionRow {
  from_name: string;
  to_name: string;
  count: number;
  status: 'new' | 'in_code' | 'promoted';
}

interface PromotedRow {
  from_name: string;
  to_name: string;
  suggestion_count: number;
  approved_at: string;
}

const STATUS_LABELS: Record<SuggestionRow['status'], string> = {
  new: '미검토',
  in_code: '코드 상수에 있음',
  promoted: '승격됨',
};

const STATUS_COLORS: Record<SuggestionRow['status'], string> = {
  new: 'text-warning bg-warning/10',
  in_code: 'text-text-muted bg-white/5',
  promoted: 'text-success bg-success/10',
};

export default function AdminSubstituteSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [promoted, setPromoted] = useState<PromotedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionRow['status']>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [manualFrom, setManualFrom] = useState('');
  const [manualTo, setManualTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/substitute-suggestions');
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions ?? []);
        setPromoted(data.promoted ?? []);
      } else {
        alert(data.error || '불러오기 실패');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (from: string, to: string, count: number) => {
    const key = `${from}→${to}`;
    setBusy(key);
    try {
      const res = await fetch('/api/admin/substitute-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_name: from, to_name: to, suggestion_count: count,
          source: 'pattern_promoted',
        }),
      });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json();
        alert(data.error || '승인 실패');
      }
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (from: string, to: string) => {
    const key = `${from}→${to}`;
    if (!confirm(`"${from} → ${to}" 매핑을 제거하시겠습니까?`)) return;
    setBusy(key);
    try {
      const res = await fetch(`/api/admin/substitute-suggestions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json();
        alert(data.error || '제거 실패');
      }
    } finally {
      setBusy(null);
    }
  };

  const addManual = async () => {
    const f = manualFrom.trim();
    const t = manualTo.trim();
    if (!f || !t) { alert('재료명 두 개 입력'); return; }
    setBusy('manual');
    try {
      const res = await fetch('/api/admin/substitute-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_name: f, to_name: t, source: 'admin' }),
      });
      if (res.ok) {
        setManualFrom('');
        setManualTo('');
        await load();
      } else {
        const data = await res.json();
        alert(data.error || '추가 실패');
      }
    } finally {
      setBusy(null);
    }
  };

  const filtered = statusFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.status === statusFilter);

  const counts = {
    all: suggestions.length,
    new: suggestions.filter(s => s.status === 'new').length,
    in_code: suggestions.filter(s => s.status === 'in_code').length,
    promoted: suggestions.filter(s => s.status === 'promoted').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">대체 재료 제안 검토</h1>
        <p className="text-sm text-text-muted">
          사용자가 레시피 작성 시 적은 대체 재료(<code className="text-accent-warm">recipe_ingredients.substitutes</code>)
          누적 패턴입니다. 빈도가 높고 적절한 매핑은 승격하면 전역 매칭에 반영됩니다.
        </p>
      </div>

      {/* 직접 추가 */}
      <div className="rounded-xl border border-white/10 bg-background-secondary p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">직접 추가</h2>
        <div className="flex flex-wrap items-center gap-2">
          <InputBoxWrapper className="flex-1 min-w-[180px] !rounded-lg !px-3 !py-2">
            <input
              type="text"
              value={manualFrom}
              onChange={e => setManualFrom(e.target.value)}
              placeholder="레시피 재료 (예: 청양고추)"
              className={`${INPUT_INNER_COMFORTABLE_CLASS} text-sm`}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
          <span className="text-text-muted">↔</span>
          <InputBoxWrapper className="flex-1 min-w-[180px] !rounded-lg !px-3 !py-2">
            <input
              type="text"
              value={manualTo}
              onChange={e => setManualTo(e.target.value)}
              placeholder="대체 재료 (예: 페페론치노)"
              className={`${INPUT_INNER_COMFORTABLE_CLASS} text-sm`}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
          <button
            onClick={addManual}
            disabled={busy === 'manual'}
            className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(['all', 'new', 'in_code', 'promoted'] as const).map(key => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === key
                ? 'bg-accent-warm text-background-primary font-bold'
                : 'bg-background-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {key === 'all' ? '전체' : STATUS_LABELS[key]} <span className="opacity-60">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-secondary">
              <tr className="text-left text-text-muted text-xs">
                <th className="px-4 py-3 font-medium">레시피 재료</th>
                <th className="px-4 py-3 font-medium">대체 재료</th>
                <th className="px-4 py-3 font-medium">누적</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">아직 제안된 대체 재료가 없습니다</td></tr>
              ) : filtered.map(s => {
                const key = `${s.from_name}→${s.to_name}`;
                return (
                  <tr key={key} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-text-primary font-medium">{s.from_name}</td>
                    <td className="px-4 py-3 text-text-secondary">→ {s.to_name}</td>
                    <td className="px-4 py-3 text-text-muted">{s.count}건</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'new' && (
                        <button
                          onClick={() => approve(s.from_name, s.to_name, s.count)}
                          disabled={busy === key}
                          className="px-3 py-1.5 rounded bg-success/20 text-success font-medium text-xs hover:bg-success/30 disabled:opacity-50"
                        >
                          승격
                        </button>
                      )}
                      {s.status === 'promoted' && (
                        <button
                          onClick={() => revoke(s.from_name, s.to_name)}
                          disabled={busy === key}
                          className="px-3 py-1.5 rounded bg-error/20 text-error font-medium text-xs hover:bg-error/30 disabled:opacity-50"
                        >
                          취소
                        </button>
                      )}
                      {s.status === 'in_code' && (
                        <span className="text-xs text-text-muted">코드에 있음</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 어드민이 직접 추가했지만 사용자 제안에 없는 매핑도 표시 (직접 추가한 row) */}
      {promoted.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-background-secondary p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            승격된 전체 매핑 ({promoted.length}개)
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {promoted.map(p => (
              <span key={`${p.from_name}-${p.to_name}`} className="inline-flex items-center gap-1 rounded bg-background-tertiary px-2 py-1">
                <span className="text-text-secondary">{p.from_name}</span>
                <span className="text-text-muted">↔</span>
                <span className="text-text-secondary">{p.to_name}</span>
                <button
                  onClick={() => revoke(p.from_name, p.to_name)}
                  className="ml-1 text-error hover:text-error/80"
                  title="제거"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
