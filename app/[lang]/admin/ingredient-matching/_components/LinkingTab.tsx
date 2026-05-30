'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';

/**
 * 재료 매칭 — "번호 연결" 탭 (2026-05-29).
 *
 * recipe_ingredients.ingredient_id 가 NULL 인 재료 이름들을 빈도순으로 보여주고,
 * 어드민이 *승인*으로 번호(ingredient_id)를 붙인다 (자동 부여 X — 추측 0 정직성 정책).
 *
 *  - 이름 정확일치 마스터 있음 → [✓ 연결] 한 번
 *  - 애매/없음 → 모달에서 [다른 재료로 연결·별칭] 또는 [새 재료 생성]
 *
 * 관계(쌀→밥 등)는 "관계 승인" 탭 담당.
 */

interface UnresolvedRow {
  ingredient_name: string;
  row_count: number;
  suggested_id: string | null;
  suggested_category: string | null;
  match_count: number;
}

interface MasterResult {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
}

const PAGE_SIZE = 100;

// 카테고리 — 새 재료 생성 시 선택지 (KitchenHomeClient 와 동일 키)
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'veggie', label: '채소' }, { value: 'meat', label: '육류' },
  { value: 'seafood', label: '해산물' }, { value: 'egg', label: '달걀류' },
  { value: 'dairy', label: '유제품' }, { value: 'grain', label: '곡류·면' },
  { value: 'legume', label: '콩·견과' }, { value: 'fruit', label: '과일' },
  { value: 'fermented', label: '발효식품' }, { value: 'seasoning', label: '양념&소스' },
  { value: 'condiment', label: '조미료' }, { value: 'oil', label: '유지·기름' },
  { value: 'sweetener', label: '당류·감미료' }, { value: 'spice', label: '향신료' },
  { value: 'bakery', label: '빵·베이커리' }, { value: 'beverage', label: '음료' },
  { value: 'snack', label: '간식·디저트' }, { value: 'processed', label: '가공식품' },
  { value: 'other', label: '기타' },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

export default function LinkingTab() {
  const toast = useToast();
  const { t } = useI18n();

  const [items, setItems] = useState<UnresolvedRow[]>([]);
  const [distinctNames, setDistinctNames] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyName, setBusyName] = useState<string | null>(null);

  // 모달 (다른 재료로 연결·별칭 / 새 재료 생성)
  const [modalRow, setModalRow] = useState<UnresolvedRow | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<MasterResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [newCategory, setNewCategory] = useState('veggie');

  const load = useCallback(async (off: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ingredient-matching?limit=${PAGE_SIZE}&offset=${off}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);
      setItems(data.items ?? []);
      setDistinctNames(data.distinctNames ?? 0);
      setTotalRows(data.totalRows ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { load(offset); }, [load, offset]);

  // 모달 검색 (입력 변화 시)
  useEffect(() => {
    if (!modalRow) return;
    const q = searchQ.trim();
    if (q.length < 1) { setSearchResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/ingredient-matching?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && res.ok) setSearchResults(data.results ?? []);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [searchQ, modalRow]);

  const postAction = async (label: string, body: Record<string, unknown>) => {
    const name = body.ingredient_name as string;
    setBusyName(name);
    try {
      const res = await fetch('/api/admin/ingredient-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);
      toast.success(`${label} — ${data.linked ?? 0}개 행 연결`);
      setModalRow(null);
      setSearchQ('');
      setSearchResults([]);
      await load(offset);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusyName(null);
    }
  };

  const openModal = (row: UnresolvedRow) => {
    setModalRow(row);
    setSearchQ('');
    setSearchResults([]);
    setNewCategory(row.suggested_category || 'veggie');
  };

  const pageStart = offset + 1;
  const pageEnd = offset + items.length;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < distinctNames;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold mb-1">번호 없는 레시피 재료</h2>
        <p className="text-sm text-text-secondary">
          {loading ? '불러오는 중…' : (
            <>
              공개 레시피 기준 미연결 재료 <span className="font-bold text-text-primary">{distinctNames.toLocaleString()}개</span>
              {' '}(전체 영향 <span className="font-bold text-text-primary">{totalRows.toLocaleString()}행</span>) · 빈도순.
              승인하면 그 이름의 (비공개 포함) 모든 행에 번호가 붙고 목록에서 빠집니다.
              {' '}비공개 레시피에만 있는 재료(예: 멸치육수)는 큐에서 제외됩니다.
            </>
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-text-muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="text-text-muted">번호 없는 재료가 없습니다 🎉</p>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-2 text-left">재료 이름</th>
                <th className="px-4 py-2 text-center">영향 행</th>
                <th className="px-4 py-2 text-left">제안</th>
                <th className="px-4 py-2 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isBusy = busyName === row.ingredient_name;
                return (
                  <tr key={row.ingredient_name} className="border-t border-white/5">
                    <td className="px-4 py-2 font-medium">{row.ingredient_name}</td>
                    <td className="px-4 py-2 text-center font-mono text-text-secondary">{row.row_count}</td>
                    <td className="px-4 py-2 text-xs">
                      {row.suggested_id ? (
                        <span className="text-success">
                          ✓ 정확일치 · {CATEGORY_LABEL[row.suggested_category ?? ''] ?? row.suggested_category}
                        </span>
                      ) : row.match_count > 1 ? (
                        <span className="text-warning">여러 개 일치 (애매)</span>
                      ) : (
                        <span className="text-text-muted">제안 없음 (신규/변형)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        {row.suggested_id && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => postAction('연결', {
                              action: 'link',
                              ingredient_name: row.ingredient_name,
                              ingredient_id: row.suggested_id,
                            })}
                            className="px-3 py-1 rounded-lg bg-accent-warm/10 text-accent-warm border border-accent-warm/30 hover:bg-accent-warm/20 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            ✓ 연결
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => openModal(row)}
                          className="px-3 py-1 rounded-lg bg-background-secondary border border-white/10 text-text-secondary hover:bg-white/10 transition-colors text-xs font-medium disabled:opacity-50"
                        >
                          {row.suggested_id ? '다른 재료로…' : '연결·생성…'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && distinctNames > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{pageStart.toLocaleString()}–{pageEnd.toLocaleString()} / {distinctNames.toLocaleString()}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
              className="px-3 py-1 rounded-lg bg-background-secondary border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-3 py-1 rounded-lg bg-background-secondary border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 모달 — 다른 재료로 연결·별칭 / 새 재료 생성 */}
      {modalRow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalRow(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 rounded-2xl bg-background-primary border border-white/10 shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-1">
              <span className="text-accent-warm">{modalRow.ingredient_name}</span> 처리
            </h3>
            <p className="text-sm text-text-secondary mb-4">레시피 {modalRow.row_count}개 행에 적용됩니다.</p>

            {/* A. 기존 재료로 연결·별칭 */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-2">기존 재료로 연결 (다르면 별칭으로 등록)</div>
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="재료 검색…"
                className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 text-sm focus:outline-none focus:border-accent-warm/50"
              />
              <div className="mt-2 space-y-1">
                {searching ? (
                  <p className="text-xs text-text-muted px-1">검색 중…</p>
                ) : searchResults.length === 0 && searchQ.trim() ? (
                  <p className="text-xs text-text-muted px-1">일치하는 재료 없음 — 아래에서 새 재료로 생성하세요.</p>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={busyName === modalRow.ingredient_name}
                      onClick={() => postAction(
                        m.name === modalRow.ingredient_name ? '연결' : '별칭 연결',
                        { action: 'alias_link', ingredient_name: modalRow.ingredient_name, target_id: m.id },
                      )}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-accent-warm/40 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                    >
                      <span className="text-lg">{m.emoji ?? '🍽️'}</span>
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className="text-xs text-text-muted">{CATEGORY_LABEL[m.category] ?? m.category}</span>
                      {m.name !== modalRow.ingredient_name && (
                        <span className="ml-auto text-xs text-accent-warm">별칭으로</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* B. 새 재료 생성 */}
            <div className="border-t border-white/10 pt-4">
              <div className="text-sm font-medium mb-2">또는 새 재료로 생성</div>
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-background-secondary border border-white/10 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button
                  type="button"
                  disabled={busyName === modalRow.ingredient_name}
                  onClick={() => postAction('새 재료 생성', {
                    action: 'create_link',
                    ingredient_name: modalRow.ingredient_name,
                    category: newCategory,
                  })}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 text-sm"
                >
                  ＋ &quot;{modalRow.ingredient_name}&quot; 생성 + 연결
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalRow(null)}
              className="mt-5 w-full px-4 py-2 rounded-xl bg-background-secondary text-text-secondary hover:bg-white/10 transition-colors text-sm"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
