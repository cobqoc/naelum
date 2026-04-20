'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TopRecipe {
  id: string;
  title: string;
  views_count: number;
  saves_count: number;
  author: { username: string } | null;
}

interface TopUser {
  username: string;
  recipes_count: number;
}

interface AnalyticsData {
  topRecipes: TopRecipe[];
  topUsers: TopUser[];
  recentSignups: number;
  range: string;
}

const RANGE_LABELS: Record<string, string> = {
  '7d': '최근 7일',
  '30d': '최근 30일',
  '90d': '최근 90일',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?range=${range}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">통계 분석</h1>
        <div className="flex gap-2">
          {Object.entries(RANGE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === value
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-secondary hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-text-muted">데이터를 불러올 수 없습니다.</div>
      ) : (
        <div className="space-y-6">
          {/* 신규 가입자 */}
          <div className="p-6 rounded-xl bg-background-secondary border border-white/10">
            <div className="text-sm text-text-muted mb-1">{RANGE_LABELS[range]} 신규 가입자</div>
            <div className="text-4xl font-bold text-accent-warm">
              {data.recentSignups.toLocaleString()}
              <span className="text-base text-text-muted font-normal ml-2">명</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 레시피 TOP 10 */}
            <div className="rounded-xl bg-background-secondary border border-white/10 p-6">
              <h2 className="text-lg font-bold mb-4">조회수 TOP 10 레시피</h2>
              {data.topRecipes.length === 0 ? (
                <p className="text-text-muted text-sm">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {data.topRecipes.map((recipe, idx) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary"
                    >
                      <span className="text-lg font-bold text-text-muted w-6 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="text-sm font-medium hover:text-accent-warm transition-colors line-clamp-1"
                        >
                          {recipe.title}
                        </Link>
                        <p className="text-xs text-text-muted">
                          @{recipe.author?.username || '(탈퇴한 사용자)'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">
                          {(recipe.views_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-text-muted">조회</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 활발한 사용자 TOP 10 */}
            <div className="rounded-xl bg-background-secondary border border-white/10 p-6">
              <h2 className="text-lg font-bold mb-4">레시피 수 TOP 10 사용자</h2>
              {data.topUsers.length === 0 ? (
                <p className="text-text-muted text-sm">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {data.topUsers.map((user, idx) => (
                    <div
                      key={user.username}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary"
                    >
                      <span className="text-lg font-bold text-text-muted w-6 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/@${user.username}`}
                          className="text-sm font-medium hover:text-accent-warm transition-colors"
                        >
                          @{user.username}
                        </Link>
                        <p className="text-xs text-text-muted">
                          레시피 {(user.recipes_count || 0).toLocaleString()}개
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">
                          {(user.recipes_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-text-muted">레시피</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
