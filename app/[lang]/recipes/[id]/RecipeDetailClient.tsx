'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import RecipeBrowseView from '@/components/RecipeBrowseView';

// 무거운 하위 뷰 / 인터랙티브 모달류는 기존대로 lazy import 유지
const RecipeComments = dynamic(() => import('@/components/RecipeComments'), { ssr: false });
const RecipeRatings = dynamic(() => import('@/components/RecipeRatings'), { ssr: false });

interface RecipeIngredient {
  ingredient_name: string;
  ingredient_id?: string | null;
  quantity: string;
  unit: string;
  notes?: string;
}

interface RecipeStep {
  title?: string;
  instruction: string;
  step_number: number;
  timer_minutes?: number | null;
  tip?: string;
  image_url?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  servings: number | null;
  average_rating: number;
  ratings_count: number;
  cooked_count?: number;
  likes_count?: number;
  author: { username: string; avatar_url: string | null; bio: string | null } | null;
  author_id: string;
  thumbnail_url: string | null;
  ingredients_image_url?: string | null;
  video_url?: string | null;
  show_source?: boolean | null;
  source_url?: string | null;
  attributed_chef?: string | null;
  source_channel?: string | null;
  status: string;
  calories?: number | null;
  protein_grams?: number | null;
  carbs_grams?: number | null;
  fat_grams?: number | null;
  fiber_grams?: number | null;
  sodium_mg?: number | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeDetailClientProps {
  recipe: Recipe;
  currentUserId: string | null;
  initialUserIngredients: string[];
  initialUserIngredientIds: string[];
  initialIsSaved: boolean;
  initialSaveNotes: string | null;
  initialIsLiked: boolean;
  initialLikesCount: number;
  initialHasCooked: boolean;
}

export default function RecipeDetailClient({
  recipe: initialRecipe,
  currentUserId,
  initialUserIngredients,
  initialUserIngredientIds,
  initialIsSaved,
  initialSaveNotes,
  initialIsLiked,
  initialLikesCount,
  initialHasCooked,
}: RecipeDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const { profile: authProfile } = useAuth();

  // recipe는 state로 보관 — refreshRecipeRatings로 교체될 수 있음
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const id = recipe.id;

  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [saveNotes, setSaveNotes] = useState<string | null>(initialSaveNotes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [userIngredients] = useState<string[]>(initialUserIngredients);
  const [userIngredientIds] = useState<string[]>(initialUserIngredientIds);
  const [actionLoading, setActionLoading] = useState(false);
  // 조회수 증가 중복 방지용 ref
  const viewIncrementedRef = useRef(false);

  // hasCooked는 현재 플로우에서 페이지 내 mutation이 없으므로 setter 생략
  const [hasCooked] = useState(initialHasCooked);

  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect — 헤더 배경 전환
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 조회수 증가 (클라이언트 전용, sessionStorage + POST)
  useEffect(() => {
    if (!id) return;

    // useRef로 중복 호출 방지 (React Strict Mode 대응)
    if (viewIncrementedRef.current) return;

    const viewKey = `recipe_viewed_${id}`;
    const lastViewed = sessionStorage.getItem(viewKey);
    const now = Date.now();

    // 5분 이내에 이미 조회한 경우 스킵
    if (lastViewed && (now - parseInt(lastViewed)) < 5 * 60 * 1000) return;

    viewIncrementedRef.current = true;

    const incrementViews = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}/view`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          sessionStorage.setItem(viewKey, now.toString());
        }
      } catch (error) {
        console.error('Error incrementing views:', error);
        viewIncrementedRef.current = false;
      }
    };

    incrementViews();

    // Track for personalization learning
    fetch('/api/recommendations/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: id, action: 'view', recommendation_type: 'personalized' }),
    }).catch(() => {});
  }, [id]);

  const handleSave = async () => {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/recipes/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.ok) {
        setIsSaved(data.saved);
        if (!data.saved) setSaveNotes(null);
        // Track save for personalization
        if (data.saved) {
          fetch('/api/recommendations/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipe_id: id, action: 'save', recommendation_type: 'personalized' }),
          }).catch(() => {});
        }
      } else if (res.status === 401) {
        toast.warning(t.recipe.toastSaveLogin, {
          action: {
            label: t.recipe.toastLoginCta,
            onClick: () => router.push(`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`)
          }
        });
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;

    // 낙관적 업데이트
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/recipes/${id}/like`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setIsLiked(data.liked);
        // 서버 실제값과 동기화
        if (data.liked !== !prevLiked) {
          setLikesCount(data.liked ? prevCount + 1 : Math.max(0, prevCount - 1));
        }
      } else if (res.status === 401) {
        // 롤백 + 로그인 유도
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
        toast.warning(t.recipe.toastLikeLogin, {
          action: {
            label: t.recipe.toastLoginCta,
            onClick: () => router.push(`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`)
          }
        });
      } else {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleUpdateMemo = async (notes: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveNotes(data.notes);
      }
    } catch (error) {
      console.error('Memo update error:', error);
    }
  };

  // 리뷰 수정 후 레시피 평점 데이터 새로고침
  const refreshRecipeRatings = async () => {
    try {
      const supabase = createClient();
      const { data: recipeData } = await supabase
        .from('recipes')
        .select('average_rating, ratings_count')
        .eq('id', id)
        .single();

      if (recipeData) {
        setRecipe(prev => ({
          ...prev,
          average_rating: recipeData.average_rating,
          ratings_count: recipeData.ratings_count,
        }));
      }
    } catch (error) {
      console.error('Error refreshing recipe ratings:', error);
    }
  };

  const currentUsername = authProfile?.username ?? null;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-32">
      {/* Header */}
      <div className={`sticky top-0 z-20 border-b transition-all duration-300 ${
        isScrolled
          ? 'bg-background-secondary/90 backdrop-blur-xl border-white/10 shadow-lg'
          : 'bg-transparent border-transparent'
      }`}>
        <div className="container mx-auto max-w-2xl px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background-secondary text-text-primary hover:bg-background-tertiary transition-all flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1 truncate text-sm font-semibold text-text-secondary">
            {recipe.title}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {currentUserId && recipe.author_id === currentUserId && (
              <Link
                href={`/recipes/${id}/edit`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-background-secondary text-text-primary hover:bg-background-tertiary transition-all"
                title={t.recipe.modify}
              >
                ✏️
              </Link>
            )}
            {currentUsername ? (
              <Link
                href={`/@${currentUsername}`}
                className="flex h-11 w-11 items-center justify-center text-2xl hover:opacity-70 transition-all"
                title={t.common.profile}
              >
                👤
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-11 w-11 items-center justify-center text-2xl hover:opacity-70 transition-all"
                title={t.common.login}
              >
                👤
              </Link>
            )}
          </div>
        </div>
      </div>

      <RecipeBrowseView
        recipe={recipe}
        userIngredients={userIngredients}
        userIngredientIds={userIngredientIds}
        isSaved={isSaved}
        saveNotes={saveNotes}
        onToggleSave={handleSave}
        onUpdateMemo={handleUpdateMemo}
        actionLoading={actionLoading}
        hasCooked={hasCooked}
        isLiked={isLiked}
        likesCount={likesCount}
        onToggleLike={handleLike}
        likeLoading={likeLoading}
        isAuthor={currentUserId !== null && recipe.author_id === currentUserId}
      />

      {/* 리뷰 섹션 */}
      <RecipeRatings
        recipeId={id}
        averageRating={recipe.average_rating}
        ratingsCount={recipe.ratings_count}
        currentUserId={currentUserId}
        hasCooked={hasCooked}
        onRatingUpdate={refreshRecipeRatings}
      />

      {/* 댓글 섹션 */}
      <RecipeComments
        recipeId={id}
        currentUserId={currentUserId}
      />

    </div>
  );
}
