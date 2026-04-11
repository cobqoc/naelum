'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/toast/context';

interface AdminRecipe {
  id: string;
  title: string;
  thumbnail_url: string | null;
  cuisine_type: string | null;
  difficulty_level: string | null;
  is_published: boolean;
  is_public: boolean;
  views_count: number;
  average_rating: number;
  created_at: string;
  author: { id: string; username: string } | null;
}

export default function AdminRecipesPage() {
  const toast = useToast();
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const loadRecipes = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(search && { search }),
      ...(status && { status }),
    });

    const res = await fetch(`/api/admin/recipes?${params}`);
    const data = await res.json();

    if (data.recipes) {
      setRecipes(data.recipes);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const handleTogglePublish = async (recipe: AdminRecipe) => {
    const action = recipe.is_published ? 'unpublish' : 'publish';
    const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      toast.success(recipe.is_published ? '비공개 처리되었습니다' : '공개 처리되었습니다');
      loadRecipes();
    } else {
      toast.error('처리 중 오류가 발생했습니다');
    }
  };

  const handleDelete = async (recipe: AdminRecipe) => {
    if (!confirm(`"${recipe.title}" 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      toast.success('레시피가 삭제되었습니다');
      loadRecipes();
    } else {
      toast.error('삭제 중 오류가 발생했습니다');
    }
  };

  const difficultyLabel: Record<string, string> = {
    easy: '초급',
    medium: '중급',
    hard: '고급',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">레시피 관리</h1>
        <span className="text-sm text-text-muted">총 {total.toLocaleString()}개</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="레시피 제목 검색..."
          className="flex-1 px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
        >
          <option value="">전체</option>
          <option value="published">공개</option>
          <option value="draft">비공개</option>
        </select>
      </div>

      {/* Recipes Table */}
      <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">레시피</th>
                <th className="px-4 py-3 text-left text-sm font-medium">작성자</th>
                <th className="px-4 py-3 text-left text-sm font-medium">난이도</th>
                <th className="px-4 py-3 text-left text-sm font-medium">조회수</th>
                <th className="px-4 py-3 text-left text-sm font-medium">평점</th>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">작성일</th>
                <th className="px-4 py-3 text-right text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    레시피가 없습니다
                  </td>
                </tr>
              ) : (
                recipes.map(recipe => (
                  <tr key={recipe.id} className="border-t border-white/10 hover:bg-white/5">
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
                      {recipe.difficulty_level ? difficultyLabel[recipe.difficulty_level] || recipe.difficulty_level : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{recipe.views_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {recipe.average_rating > 0 ? `★ ${recipe.average_rating.toFixed(1)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {recipe.is_published ? (
                        <span className="px-2 py-1 text-xs rounded bg-success/20 text-success">공개</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-warning/20 text-warning">비공개</span>
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
                          {recipe.is_published ? '비공개' : '공개'}
                        </button>
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

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          이전
        </button>
        <span className="px-4 py-2 rounded-lg bg-background-secondary">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
