'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RecipeReviewModal = dynamic(() => import('./RecipeReviewModal'), { ssr: false });

interface Rating {
  rating: number | null;
  review: string | null;
  photo_url: string | null;
  is_photo_only: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
  user_id: string;
}

interface RecipeRatingsProps {
  recipeId: string;
  averageRating: number;
  ratingsCount: number;
  currentUserId: string | null;
  hasCooked: boolean;
  onRatingUpdate?: () => void;
}

export default function RecipeRatings({ recipeId, averageRating, ratingsCount, currentUserId, // eslint-disable-next-line @typescript-eslint/no-unused-vars
hasCooked, onRatingUpdate }: RecipeRatingsProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  // 평균 평점을 로컬 state로 관리하여 실시간 업데이트 반영
  const [displayAverageRating, setDisplayAverageRating] = useState(averageRating);
  const [displayRatingsCount, setDisplayRatingsCount] = useState(ratingsCount);

  // props가 변경되면 로컬 state 업데이트
  useEffect(() => {
    setDisplayAverageRating(averageRating);
    setDisplayRatingsCount(ratingsCount);
  }, [averageRating, ratingsCount]);

  // 리뷰 모달 상태
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{ rating: number; review: string | null } | null>(null);

  // 라이트박스 상태
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // 리뷰 목록 조회
  const fetchRatings = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`/api/recipes/${recipeId}/ratings?page=${pageNum}&limit=${limit}`);
      const data = await res.json();

      if (res.ok) {
        if (append) {
          setRatings(prev => [...prev, ...data.ratings]);
        } else {
          setRatings(data.ratings);
        }
        setTotalPages(data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [recipeId, limit]);

  useEffect(() => {
    fetchRatings(1);
  }, [fetchRatings]);

  // 더보기 버튼 핸들러
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchRatings(page + 1, true);
    }
  };

  // 리뷰 수정 핸들러
  const handleEditReview = (rating: Rating) => {
    setEditingReview({ rating: rating.rating ?? 0, review: rating.review });
    setReviewModalOpen(true);
  };

  // 시간 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 30) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-lg">
            {star <= rating ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const hasMore = page < totalPages;
  const remainingCount = displayRatingsCount - ratings.length;

  if (displayRatingsCount === 0) {
    return (
      <section className="px-6 py-8 bg-background-primary">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            리뷰 <span className="text-accent-warm">0</span>
          </h2>
          <div className="py-12 text-center rounded-2xl bg-background-secondary border border-white/5">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-text-muted">아직 리뷰가 없습니다</p>
            <p className="text-sm text-text-secondary mt-2">이 레시피를 만들고 첫 리뷰를 남겨보세요!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8 bg-background-primary">
      <div className="container mx-auto max-w-2xl">
        {/* 헤더 - 평균 평점 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            리뷰 <span className="text-accent-warm">{displayRatingsCount}</span>
          </h2>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary border border-white/5">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-warm mb-1">{displayAverageRating.toFixed(1)}</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-sm">
                    {star <= Math.round(displayAverageRating) ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 text-sm text-text-secondary">
              {displayRatingsCount}개의 리뷰
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-xl bg-background-secondary animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-background-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-background-tertiary rounded" />
                    <div className="h-3 w-16 bg-background-tertiary rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-background-tertiary rounded" />
                  <div className="h-4 w-3/4 bg-background-tertiary rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 리뷰 목록 */}
            <div className="space-y-4">
              {ratings.map((rating, idx) => {
                const isOwnReview = currentUserId === rating.user_id;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-background-secondary border border-white/5 hover:border-accent-warm/20 transition-all"
                  >
                    {/* 사용자 정보 및 액션 버튼 */}
                    <div className="flex items-start justify-between mb-3">
                      <Link href={`/@${rating.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background-tertiary flex-shrink-0">
                          {rating.user.avatar_url ? (
                            <Image
                              src={rating.user.avatar_url}
                              alt={rating.user.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              👤
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-text-primary">@{rating.user.username}</div>
                            {/* 사진만 있는 리뷰 배지 */}
                            {rating.is_photo_only && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-warm/20 text-accent-warm">
                                완료 인증 📸
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted">{formatDate(rating.completed_at || rating.created_at)}</div>
                        </div>
                      </Link>

                      {/* 본인 리뷰인 경우 수정 버튼 */}
                      {isOwnReview && (
                        <button
                          onClick={() => handleEditReview(rating)}
                          className="flex items-center gap-1 text-sm text-text-muted hover:text-accent-warm transition-colors"
                        >
                          <span>✏️</span>
                          <span>{rating.is_photo_only ? '리뷰 추가하기' : '수정'}</span>
                        </button>
                      )}
                    </div>

                    {/* 별점 (rating이 있을 때만 표시) */}
                    {rating.rating && (
                      <div className="mb-2">
                        {renderStars(rating.rating)}
                      </div>
                    )}

                    {/* 완성 사진 */}
                    {rating.photo_url && (
                      <div className="mb-3">
                        <Image
                          src={rating.photo_url}
                          alt="완성 사진"
                          width={600}
                          height={400}
                          className="w-full max-w-md rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(rating.photo_url)}
                        />
                      </div>
                    )}

                    {/* 리뷰 텍스트 */}
                    {rating.review && (
                      <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                        {rating.review}
                      </p>
                    )}

                    {/* 수정됨 표시 */}
                    {rating.updated_at !== rating.created_at && (
                      <div className="text-xs text-text-muted mt-2">
                        (수정됨)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 mt-6 rounded-xl bg-background-secondary
                           text-accent-warm font-bold hover:bg-background-tertiary
                           transition-all border border-accent-warm/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore
                  ? '로딩 중...'
                  : `리뷰 더보기 (${remainingCount}개 남음)`}
              </button>
            )}
          </>
        )}
      </div>

      {/* 리뷰 모달 */}
      {reviewModalOpen && (
        <RecipeReviewModal
          recipeId={recipeId}
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setEditingReview(null);
          }}
          onSuccess={async (data) => {
            setReviewModalOpen(false);
            setEditingReview(null);

            // API에서 받은 최신 평균 평점 즉시 반영
            if (data) {
              setDisplayAverageRating(data.averageRating);
              setDisplayRatingsCount(data.ratingsCount);
              // 부모 컴포넌트의 recipe state도 업데이트
              if (onRatingUpdate) {
                onRatingUpdate();
              }
            }

            // 리뷰 목록 새로고침 (약간의 지연)
            await new Promise(resolve => setTimeout(resolve, 300));
            fetchRatings(1);
          }}
          initialRating={editingReview?.rating}
          initialReview={editingReview?.review || ''}
        />
      )}

      {/* 라이트박스 모달 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Image
            src={lightboxImage}
            alt="완성 사진 크게 보기"
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </section>
  );
}
