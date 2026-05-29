'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';

/**
 * 관계 직접 추가 폼 (2026-05-29).
 *
 * 작성자가 제안하지 않은 관계(쌀→밥 등)를 어드민이 *직접* 등록.
 * 재료 둘을 검색·선택 + 종류(가공/대체) 선택 → 기존 /api/admin/substitute-suggestions POST.
 *  - preparable_to(가공, 단방향): from 으로 to 를 만들 수 있음 (쌀→밥)
 *  - substitute(대체, 양방향): 서로 교체 — DB trigger 가 reverse row 자동 생성
 *
 * 대상 재료는 *승인된 마스터* 여야 검색됨. 없으면 "번호 연결" 탭에서 먼저 생성.
 */

interface MasterResult {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
}

type Kind = 'substitute' | 'preparable_to';

function Picker({
  label,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  selected: MasterResult | null;
  onSelect: (m: MasterResult) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MasterResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selected) return;
    const term = q.trim();
    if (!term) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/ingredient-matching?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (!cancelled && res.ok) setResults(data.results ?? []);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [q, selected]);

  if (selected) {
    return (
      <div>
        <div className="text-xs text-text-muted mb-1">{label}</div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent-warm/40 bg-accent-warm/5">
          <span className="text-lg">{selected.emoji ?? '🍽️'}</span>
          <span className="font-medium text-sm">{selected.name}</span>
          <button type="button" onClick={onClear} className="ml-auto text-text-muted hover:text-error text-sm" aria-label="선택 해제">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="재료 검색…"
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 text-sm focus:outline-none focus:border-accent-warm/50"
      />
      <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
        {searching ? (
          <p className="text-xs text-text-muted px-1">검색 중…</p>
        ) : (
          results.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-accent-warm/40 hover:bg-white/5 transition-colors text-left text-sm"
            >
              <span>{m.emoji ?? '🍽️'}</span>
              <span className="font-medium">{m.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function AddRelationForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const { t } = useI18n();
  const [from, setFrom] = useState<MasterResult | null>(null);
  const [to, setTo] = useState<MasterResult | null>(null);
  const [kind, setKind] = useState<Kind>('preparable_to');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!from || !to) return;
    if (from.id === to.id) { toast.error('서로 다른 재료를 선택하세요'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/substitute-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: from.id, to_id: to.id, kind, source: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);
      toast.success('관계 추가 완료');
      setFrom(null);
      setTo(null);
      setKind('preparable_to');
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-background-secondary/40 p-4 mb-6">
      <h3 className="text-sm font-bold mb-1">＋ 관계 직접 추가</h3>
      <p className="text-xs text-text-muted mb-3">
        작성자 제안과 무관하게 직접 등록 (쌀→밥 등). 대상 재료는 승인된 마스터여야 검색됨 — 없으면 &quot;번호 연결&quot; 탭에서 먼저 생성.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Picker label="재료 A (from)" selected={from} onSelect={setFrom} onClear={() => setFrom(null)} />
        <Picker label="재료 B (to)" selected={to} onSelect={setTo} onClear={() => setTo(null)} />
      </div>

      <div className="space-y-2 mb-3">
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="radio" name="rel-kind" checked={kind === 'preparable_to'} onChange={() => setKind('preparable_to')} className="mt-1" />
          <span><b>가공 (단방향)</b> — A로 B를 만들 수 있음. 쌀→밥, 통마늘→다진마늘. <span className="text-text-muted">역방향 매칭 안 됨.</span></span>
        </label>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="radio" name="rel-kind" checked={kind === 'substitute'} onChange={() => setKind('substitute')} className="mt-1" />
          <span><b>대체 (양방향)</b> — 서로 바꿔 씀. 설탕↔흑설탕. <span className="text-text-muted">reverse 자동 생성.</span></span>
        </label>
      </div>

      {from && to && (
        <p className="text-xs text-text-secondary mb-2">
          {kind === 'preparable_to'
            ? `${from.name} → ${to.name} (${from.name}으로 ${to.name} 만들 수 있음)`
            : `${from.name} ↔ ${to.name}`}
        </p>
      )}

      <button
        type="button"
        disabled={!from || !to || submitting}
        onClick={submit}
        className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 text-sm"
      >
        {submitting ? '추가 중…' : '관계 추가'}
      </button>
    </section>
  );
}
