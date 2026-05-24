'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { DIFFICULTY_LABELS } from '@/lib/types/recipe';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import ConfirmDialog from '@/components/Common/ConfirmDialog';

interface AdminRecipe {
  id: string;
  title: string;
  thumbnail_url: string | null;
  cuisine_type: string | null;
  difficulty_level: string | null;
  status: string;
  views_count: number;
  average_rating: number;
  created_at: string;
  author: { id: string; username: string } | null;
}

interface StatusCounts {
  all: number;
  published: number;
  private: number;
  draft: number;
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'published', label: '공개' },
  { key: 'private', label: '비공개' },
  { key: 'draft', label: '임시저장' },
];

export default function AdminRecipesPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, published: 0, private: 0, draft: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // 삭제 확인 — 단일·bulk 통합 pending state
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'single'; recipe: AdminRecipe }
    | { kind: 'bulk'; ids: string[] }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      sort,
      order,
      ...(search && { search }),
      ...(status && { status }),
    });

    const res = await fetch(`/api/admin/recipes?${params}`);
    const data = await res.json();

    if (data.recipes) {
      setRecipes(data.recipes);
      setTotalPages(data.pagination.totalPages);
      if (data.counts) setCounts(data.counts);
    }
    setSelected(new Set()); // 목록이 바뀌면 선택 초기화 — 선택은 페이지 단위
    setLoading(false);
  }, [page, search, status, sort, order]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleSort = (col: string) => {
    if (sort === col) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(col);
      setOrder('desc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = recipes.length > 0 && recipes.every((r) => selected.has(r.id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) recipes.forEach((r) => next.delete(r.id));
      else recipes.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const handleTogglePublish = async (recipe: AdminRecipe) => {
    const action = recipe.status === 'published' ? 'unpublish' : 'publish';
    const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast.success(recipe.status === 'published' ? '비공개 처리되었습니다' : '공개 처리되었습니다');
      loadRecipes();
    } else {
      toast.error('처리 중 오류가 발생했습니다');
    }
  };

  const handleDelete = (recipe: AdminRecipe) => {
    setPendingDelete({ kind: 'single', recipe });
  };

  const performSingleDelete = async (recipe: AdminRecipe) => {
    const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('레시피가 삭제되었습니다');
      loadRecipes();
    } else {
      toast.error('삭제 중 오류가 발생했습니다');
    }
  };

  const handleBulk = async (action: 'publish' | 'unpublish' | 'delete') => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === 'delete') {
      // 삭제는 ConfirmDialog 거치게 — pending에 ids 보관
      setPendingDelete({ kind: 'bulk', ids });
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/recipes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        const label = action === 'publish' ? '공개' : '비공개';
        toast.success(`${ids.length}개 레시피를 ${label} 처리했습니다`);
        loadRecipes();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || t.common.error);
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const performBulkDelete = async (ids: string[]) => {
    const res = await fetch('/api/admin/recipes/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action: 'delete' }),
    });
    if (res.ok) {
      toast.success(`${ids.length}개 레시피를 삭제 처리했습니다`);
      setSelected(new Set());
      loadRecipes();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || t.common.error);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'single') {
        await performSingleDelete(pendingDelete.recipe);
      } else {
        await performBulkDelete(pendingDelete.ids);
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const sortArrow = (col: string) => (sort === col ? (order === 'desc' ? ' ▼' : ' ▲') : '');

  return (
    <div className="space-y-5">
      {/* 헤더 — 상태별 개수 분해 */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">레시피 관리</h1>
        <span className="text-sm text-text-muted">
          총 {counts.all.toLocaleString()}개
          <span className="ml-2 text-text-muted/60">
            공개 {counts.published.toLocaleString()} · 비공개 {counts.private.toLocaleString()} · 임시저장 {counts.draft.toLocaleString()}
          </span>
        </span>
      </div>

      {/* 검색 */}
      <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="레시피 제목 검색..."
          className={INPUT_INNER_COMFORTABLE_CLASS}
          style={INPUT_INNER_STYLE}
        />
      </InputBoxWrapper>

      {/* 상태 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const c = tab.key === '' ? counts.all : counts[tab.key as keyof StatusCounts];
          return (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === tab.key
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label} <span className="opacity-70">{c.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {/* 일괄 작업 바 — 선택 항목이 있을 때만 */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-4 py-3 rounded-xl bg-accent-warm/10 border border-accent-warm/30">
          <span className="text-sm font-medium">{selected.size}개 선택됨</span>
          <div className="flex-1" />
          <button onClick={() => handleBulk('publish')} disabled={bulkBusy}
            className="px-3 py-1.5 text-sm rounded-lg bg-success/20 text-success hover:bg-success/30 disabled:opacity-50 transition-colors">일괄 공개</button>
          <button onClick={() => handleBulk('unpublish')} disabled={bulkBusy}
            className="px-3 py-1.5 text-sm rounded-lg bg-warning/20 text-warning hover:bg-warning/30 disabled:opacity-50 transition-colors">일괄 비공개</button>
          <button onClick={() => handleBulk('delete')} disabled={bulkBusy}
            className="px-3 py-1.5 text-sm rounded-lg bg-error/20 text-error hover:bg-error/30 disabled:opacity-50 transition-colors">일괄 삭제</button>
          <button onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors">선택 해제</button>
        </div>
      )}

      {/* 레시피 테이블 */}
      <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-orange-500" aria-label="페이지 전체 선택" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">레시피</th>
                <th className="px-4 py-3 text-left text-sm font-medium">작성자</th>
                <th className="px-4 py-3 text-left text-sm font-medium">난이도</th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button onClick={() => handleSort('views')} className="hover:text-accent-warm transition-colors">조회수{sortArrow('views')}</button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button onClick={() => handleSort('rating')} className="hover:text-accent-warm transition-colors">평점{sortArrow('rating')}</button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button onClick={() => handleSort('created')} className="hover:text-accent-warm transition-colors">작성일{sortArrow('created')}</button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-muted">레시피가 없습니다</td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <tr key={recipe.id} className={`border-t border-white/10 hover:bg-white/5 ${selected.has(recipe.id) ? 'bg-accent-warm/5' : ''}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(recipe.id)} onChange={() => toggleSelect(recipe.id)}
                        className="w-4 h-4 cursor-pointer accent-orange-500" aria-label={`${recipe.title} 선택`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          target="_blank"
                          className="font-medium hover:text-accent-warm transition-colors line-clamp-2"
                        >
                          {recipe.title}
                        </Link>
                        {recipe.cuisine_type && (
                          <span className="text-xs text-text-muted">{recipe.cuisine_type}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {recipe.author ? `@${recipe.author.username}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {recipe.difficulty_level ? DIFFICULTY_LABELS[recipe.difficulty_level] || recipe.difficulty_level : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{recipe.views_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {recipe.average_rating > 0 ? `★ ${recipe.average_rating.toFixed(1)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {recipe.status === 'published' ? (
                        <span className="px-2 py-1 text-xs rounded bg-success/20 text-success">공개</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-warning/20 text-warning">{recipe.status === 'private' ? '비공개' : '임시저장'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {new Date(recipe.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(recipe)}
                          className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {recipe.status === 'published' ? '비공개' : '공개'}
                        </button>
                        <Link
                          href={`/recipes/${recipe.id}/edit`}
                          target="_blank"
                          className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(recipe)}
                          className="px-3 py-1 text-xs rounded bg-error/20 text-error hover:bg-error/30 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          이전
        </button>
        <span className="px-4 py-2 rounded-lg bg-background-secondary">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          다음
        </button>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={
          pendingDelete?.kind === 'single'
            ? `"${pendingDelete.recipe.title}" 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : pendingDelete?.kind === 'bulk'
              ? `선택한 ${pendingDelete.ids.length}개 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
              : ''
        }
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
      />
    </div>
  );
}
