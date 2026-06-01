'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Post, PostsResponse } from './types';
import PostCard from './PostCard';
import ReplyForm from './ReplyForm';
import ReviewComposerModal from './ReviewComposerModal';

interface RecipePostsFeedProps {
  recipeId: string;
  currentUserId: string | null;
  /** 본인 레시피면 별점 작성 차단(댓글만) */
  isAuthor?: boolean;
  /** 리뷰 별점 변동 시 부모 레시피 평균 새로고침 */
  onRatingUpdate?: () => void;
}

type Filter = 'all' | 'reviews';

// 통합 피드 — 리뷰(별점)·댓글·답글을 한 곳에서. RecipeRatings + RecipeComments 대체.
export default function RecipePostsFeed({ recipeId, currentUserId, isAuthor = false, onRatingUpdate }: RecipePostsFeedProps) {
  const { t } = useI18n();
  const tp = t.posts;

  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => { fetchFeed(filter, 1, false); setPage(1); }, [filter, fetchFeed]);

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
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-text-primary">
          {tp.sectionTitle} {total > 0 && <span className="text-accent-warm">{total}</span>}
        </h2>
        {ratingsCount > 0 && (
          <span className="text-sm text-text-secondary">
            ⭐ {averageRating.toFixed(1)} · {ratingsCount}{tp.cookedCountSuffix}
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

      {/* 작성 영역 */}
      <div className="mb-6 space-y-3">
        {!isAuthor && (
          <button onClick={() => setReviewOpen(true)}
            className="w-full py-2.5 rounded-xl border border-accent-warm/40 text-accent-warm font-bold text-sm hover:bg-accent-warm/10 transition-colors">
            ⭐ {tp.reviewCta}
          </button>
        )}
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

      <ReviewComposerModal recipeId={recipeId} isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)} onSuccess={refreshAfterReview} />
    </section>
  );
}
