'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast/context';
import { createClient } from '@/lib/supabase/client';

interface RecipeReviewModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data?: { averageRating: number; ratingsCount: number }) => void;
  initialRating?: number;
  initialReview?: string;
}

export default function RecipeReviewModal({
  recipeId,
  isOpen,
  onClose,
  onSuccess,
  initialRating = 5,
  initialReview = ''
}: RecipeReviewModalProps) {
  const toast = useToast();
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Props 변경 시 state 업데이트
  useEffect(() => {
    setRating(initialRating);
    setReview(initialReview);
  }, [initialRating, initialReview]);

  // 모달이 열릴 때 로그인 상태 확인
  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, [isOpen]);

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          review: review.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '리뷰 저장에 실패했습니다');
      }

      const data = await response.json();

      // 성공 시 콜백 호출 (업데이트된 평점 데이터 전달)
      if (onSuccess) {
        onSuccess({
          averageRating: data.averageRating,
          ratingsCount: data.ratingsCount
        });
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // 비로그인 상태면 로그인 유도
  if (isLoggedIn === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-background-secondary rounded-2xl p-6 max-w-sm w-full border border-white/10 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-lg font-bold text-text-primary mb-2">로그인이 필요합니다</h3>
          <p className="text-sm text-text-muted mb-6">리뷰를 작성하려면 로그인해주세요.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-secondary text-sm font-medium hover:bg-background-tertiary/80 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
              className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-background-secondary rounded-2xl p-6 max-w-md w-full my-8 border border-white/10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-primary">
            {initialRating || initialReview ? '리뷰 수정' : '리뷰 작성'}
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full hover:bg-background-tertiary transition-colors flex items-center justify-center disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* 평점 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text-primary mb-3">
            평점을 선택해주세요
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                disabled={submitting}
                className="text-4xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-center text-text-muted text-sm mt-2">
            {rating}점
          </p>
        </div>

        {/* 리뷰 텍스트 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text-primary mb-2">
            리뷰 (선택사항)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            disabled={submitting}
            placeholder="이 레시피에 대한 경험을 공유해주세요..."
            className="w-full px-4 py-3 rounded-xl bg-background-tertiary text-text-primary placeholder-text-muted border border-white/5 focus:border-accent-warm focus:outline-none resize-none disabled:opacity-50"
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-text-muted text-right mt-1">
            {review.length}/500
          </p>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 px-6 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-background-primary/30 border-t-background-primary rounded-full animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            <span>리뷰 {initialRating || initialReview ? '수정' : '제출'}</span>
          )}
        </button>
      </div>
    </div>
  );
}
