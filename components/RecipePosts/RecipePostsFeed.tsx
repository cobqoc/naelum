'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Post, PostsResponse } from './types';
import PostCard from './PostCard';
import ReplyForm from './ReplyForm';

interface RecipePostsFeedProps {
  recipeId: string;
  currentUserId: string | null;
  isAuthor?: boolean;
  /** 리뷰 별점 변동 시 부모 레시피 평균 새로고침 */
  onRatingUpdate?: () => void;
  /** 부모(상세)에서 "만들어봤어요" 성공 시 bump → 피드 새로고침 */
  refreshKey?: number;
}

type Filter = 'all' | 'reviews';

// 통합 피드 — 리뷰(별점)·댓글·답글을 한 곳에서. "만들어봤어요" 작성은 조리순서 탭 끝 버튼이 담당.
export default function RecipePostsFeed({ recipeId, currentUserId, onRatingUpdate, refreshKey = 0 }: RecipePostsFeedProps) {
  const { t } = useI18n();
  const tp = t.posts;

  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [cookedCount, setCookedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (f: Filter, p: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/posts?filter=${f}&page=${p}&limit=10`);
      const data: PostsResponse = await res.json();
      if (!res.ok) return;
      setPosts(prev => append ? [...prev, ...data.posts] : data.posts);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setAverageRating(data.averageRating);
      setRatingsCount(data.ratingsCount);
      setCookedCount(data.cookedCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  // filter 변경 또는 부모의 "만들어봤어요" 성공(refreshKey) 시 1페이지부터 재조회
  useEffect(() => { fetchFeed(filter, 1, false); setPage(1); }, [filter, fetchFeed, refreshKey]);

  const refreshAfterReview = () => {
    fetchFeed(filter, 1, false);
    setPage(1);
    onRatingUpdate?.();
  };

  const handleUpdate = (id: string, updates: Partial<Post>) =>
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  const handleDelete = (id: string) =>
    setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <section className="mt-8">
      {/* 헤더 — 만든 수(cooking_sessions) + 평점(reviews) 분리 표시 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-text-primary">
          {tp.sectionTitle} {total > 0 && <span className="text-accent-warm">{total}</span>}
        </h2>
        {(cookedCount > 0 || ratingsCount > 0) && (
          <span className="text-sm text-text-secondary">
            {cookedCount > 0 && <>🍳 {cookedCount}{tp.cookedCountSuffix}</>}
            {ratingsCount > 0 && <>{cookedCount > 0 ? ' · ' : ''}⭐ {averageRating.toFixed(1)} ({ratingsCount})</>}
          </span>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        {(['all', 'reviews'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-accent-warm text-background-primary' : 'bg-background-tertiary text-text-secondary hover:text-text-primary'
            }`}>
            {f === 'all' ? tp.tabAll : tp.tabReviews}
          </button>
        ))}
      </div>

      {/* 작성 영역 — 댓글/질문 (별점 리뷰는 조리순서 탭 끝 "다 만들었어요" 에서) */}
      <div className="mb-6">
        <ReplyForm recipeId={recipeId} placeholder={tp.commentPlaceholder}
          onCreated={(post) => setPosts(prev => [post, ...prev])} />
      </div>

      {/* 목록 */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-text-primary font-medium">{tp.emptyTitle}</p>
          <p className="text-text-muted text-sm mt-1">{tp.emptySub}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} recipeId={recipeId}
              onUpdate={handleUpdate} onDelete={handleDelete} onRatingChanged={refreshAfterReview} />
          ))}
        </div>
      )}

      {/* 더보기 */}
      {page < totalPages && (
        <button onClick={() => { const np = page + 1; setPage(np); fetchFeed(filter, np, true); }}
          disabled={loading}
          className="w-full mt-4 py-2.5 rounded-xl bg-background-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors disabled:opacity-50">
          {loading ? t.comments.loading : `${t.comments.loadMore} (${total - posts.length}${t.comments.remaining})`}
        </button>
      )}
    </section>
  );
}
