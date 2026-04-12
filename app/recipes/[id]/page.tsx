'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { useAuth } from '@/lib/auth/context';
import RecipeJsonLd from '@/components/RecipeJsonLd';

const RecipeBrowseView = dynamic(() => import('@/components/RecipeBrowseView'), { ssr: false });
const RecipeCookMode = dynamic(() => import('@/components/RecipeCookMode'), { ssr: false });
const InteractiveFridge = dynamic(() => import('@/components/Fridge/InteractiveFridge'), { ssr: false });
const RecipeComments = dynamic(() => import('@/components/RecipeComments'), { ssr: false });
const RecipeRatings = dynamic(() => import('@/components/RecipeRatings'), { ssr: false });
const RecipeReviewModal = dynamic(() => import('@/components/RecipeReviewModal'), { ssr: false });

interface RecipeIngredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes?: string; // 추가 설명 (예: "잘게 썬", "굵게 다진")
}

interface RecipeStep {
  title?: string;
  instruction: string;
  step_number: number;
  timer_minutes?: number | null;
  tip?: string;
  image_url?: string | null;
}

interface Recipe {
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
  author: { username: string; avatar_url: string | null; bio: string | null } | null;
  author_id: string;
  thumbnail_url: string | null;
  ingredients_image_url?: string | null;
  video_url?: string | null;
  status: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage(props: PageProps) {
  const resolvedParams = use(props.params);
  const { id } = resolvedParams;
  const router = useRouter();
  const toast = useToast();

  const [isSaved, setIsSaved] = useState(false);
  const [saveNotes, setSaveNotes] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFridgeModal, setShowFridgeModal] = useState(false);
  const [preparedIngredients, setPreparedIngredients] = useState<Set<number>>(new Set());
  const [isCookMode, setIsCookMode] = useState(false);
  // 조회수 증가 중복 방지용 ref
  const viewIncrementedRef = useRef(false);

  // Cooking mode states
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Review states
  const [hasCooked, setHasCooked] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>();
  const [userReview, setUserReview] = useState<string | undefined>();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Current user profile
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Timer sound helper
  const playTimerSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      // 3회 비프음
      [0, 300, 600].forEach(delay => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioCtx.currentTime + delay / 1000);
        oscillator.stop(audioCtx.currentTime + delay / 1000 + 0.15);
      });
    } catch {
      // AudioContext not supported
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && !timerPaused && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            setTimerPaused(false);
            playTimerSound();
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('타이머 완료!', { body: '다음 단계로 진행하세요.' });
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerPaused, timerSeconds, playTimerSound]);

  const { user: authUser, profile: authProfile, loading: authLoading } = useAuth();
  const userId = authUser?.id ?? null;
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    setCurrentUsername(authProfile?.username ?? null);
  }, [authProfile?.username]);

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;
    const supabase = createClient();

    async function fetchData() {
      const user = userId ? { id: userId } : null;

      // 2. Fetch recipe details
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select(`
          *,
          author:profiles(username, avatar_url, bio),
          ingredients:recipe_ingredients(*),
          steps:recipe_steps(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!isMounted) return;

      if (recipeError) {
        console.error('Error fetching recipe:', recipeError.message, recipeError.code);
        setRecipe(null);
        setLoading(false);
        return;
      } else if (!recipeData) {
        setRecipe(null);
        setLoading(false);
        return;
      } else {
        // 3. Check if recipe is private and user has permission to view
        if (recipeData.status !== 'published') {
          // Private/draft recipe - only author can view
          if (!user || recipeData.author_id !== user.id) {
            // Not authorized to view this private recipe
            setRecipe(null);
            setLoading(false);
            return;
          }
        }

        // Fetch cooked count and user-specific data in parallel
        const cookedCountPromise = supabase
          .from('cooking_sessions')
          .select('user_id', { count: 'exact', head: true })
          .eq('recipe_id', id)
          .not('completed_at', 'is', null);

        if (user && isMounted) {
          // Run all user-specific queries in parallel
          const [
            { count: cookedCount },
            { data: userIngData },
            { data: saveData },
            { data: cookingData },
            { data: likeData },
          ] = await Promise.all([
            cookedCountPromise,
            supabase
              .from('user_ingredients')
              .select('ingredient_name')
              .eq('user_id', user.id),
            supabase
              .from('recipe_saves')
              .select('id, notes')
              .eq('recipe_id', id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('cooking_sessions')
              .select('id')
              .eq('recipe_id', id)
              .eq('user_id', user.id)
              .not('completed_at', 'is', null)
              .maybeSingle(),
            supabase
              .from('recipe_likes')
              .select('id')
              .eq('recipe_id', id)
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);

          if (isMounted) {
            setRecipe({ ...recipeData, cooked_count: cookedCount || 0 });
            setLikesCount(recipeData.likes_count ?? 0);
            if (userIngData) {
              setUserIngredients(userIngData.map(i => i.ingredient_name));
            }
            setIsSaved(!!saveData);
            setSaveNotes(saveData?.notes || null);
            setHasCooked(!!cookingData);
            setIsLiked(!!likeData);
          }
        } else {
          const { count: cookedCount } = await cookedCountPromise;
          if (isMounted) {
            setRecipe({ ...recipeData, cooked_count: cookedCount || 0 });
            setLikesCount(recipeData.likes_count ?? 0);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, authLoading, userId]);

  // Check if user has cooked this recipe and has reviewed it
  useEffect(() => {
    if (!userId || !id) return;

    async function checkCookedAndReview() {
      const supabase = createClient();

      // 요리 완성 여부 확인
      const { data: session } = await supabase
        .from('cooking_sessions')
        .select('id')
        .eq('user_id', userId!)
        .eq('recipe_id', id)
        .not('completed_at', 'is', null)
        .maybeSingle();

      setHasCooked(!!session);

      // 리뷰 조회
      if (session) {
        try {
          const response = await fetch(`/api/recipes/${id}/rating`);
          if (response.ok) {
            const data = await response.json();
            setUserRating(data.rating);
            setUserReview(data.review);
          }
        } catch (error) {
          console.error('Error fetching review:', error);
        }
      }
    }

    checkCookedAndReview();
  }, [userId, id]);

  // 조회수 증가
  useEffect(() => {
    if (!id) return;

    // useRef로 중복 호출 방지 (React Strict Mode 대응)
    if (viewIncrementedRef.current) {
      console.log('👁️ View increment already called, skipping');
      return;
    }

    // sessionStorage를 사용하여 중복 조회 방지
    const viewKey = `recipe_viewed_${id}`;
    const lastViewed = sessionStorage.getItem(viewKey);
    const now = Date.now();

    // 5분 이내에 이미 조회한 경우 스킵
    if (lastViewed && (now - parseInt(lastViewed)) < 5 * 60 * 1000) {
      console.log('👁️ Already viewed recently, skipping increment');
      return;
    }

    // 즉시 플래그 설정 (Race Condition 방지)
    viewIncrementedRef.current = true;

    // 페이지 로드 시 조회수 증가 API 호출
    const incrementViews = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}/view`, {
          method: 'POST',
        });
        const data = await response.json();

        // 성공 시 sessionStorage에 저장
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


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary text-accent-warm">
        <div className="animate-bounce text-2xl font-bold">낼름...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary text-text-primary">
        <div className="text-center">
          <p className="text-xl font-bold">레시피를 찾을 수 없습니다</p>
          <Link href="/" className="mt-4 inline-block text-accent-warm hover:underline">
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

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
        toast.warning('로그인이 필요합니다');
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
        toast.warning('로그인이 필요합니다');
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

      if (recipeData && recipe) {
        setRecipe({
          ...recipe,
          average_rating: recipeData.average_rating,
          ratings_count: recipeData.ratings_count
        });
      }
    } catch (error) {
      console.error('Error refreshing recipe ratings:', error);
    }
  };

  // 재료 준비 완료 토글
  const togglePreparedIngredient = (index: number) => {
    setPreparedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Cooking mode functions
  const toggleStepComplete = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerActive(true);
    setTimerPaused(false);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const toggleTimerPause = () => {
    setTimerPaused(prev => !prev);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerPaused(false);
    setTimerSeconds(0);
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-32">
      {/* Structured Data */}
      {recipe && (
        <RecipeJsonLd
          title={recipe.title}
          description={recipe.description}
          imageUrl={recipe.thumbnail_url}
          authorName={recipe.author?.username || 'anonymous'}
          prepTime={recipe.prep_time_minutes}
          cookTime={recipe.cook_time_minutes}
          servings={recipe.servings}
          rating={recipe.average_rating}
          ratingsCount={recipe.ratings_count}
          ingredients={recipe.ingredients.map(i => `${i.ingredient_name} ${i.quantity} ${i.unit}`.trim())}
          steps={recipe.steps.map(s => s.instruction)}
        />
      )}
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
            {userId && recipe.author_id === userId && (
              <Link
                href={`/recipes/${id}/edit`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-background-secondary text-text-primary hover:bg-background-tertiary transition-all"
                title="레시피 수정"
              >
                ✏️
              </Link>
            )}
            {currentUsername ? (
              <Link
                href={`/@${currentUsername}`}
                className="flex h-11 w-11 items-center justify-center text-2xl hover:opacity-70 transition-all"
                title="내 프로필"
              >
                👤
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-11 w-11 items-center justify-center text-2xl hover:opacity-70 transition-all"
                title="로그인"
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
        isSaved={isSaved}
        saveNotes={saveNotes}
        onToggleSave={handleSave}
        onUpdateMemo={handleUpdateMemo}
        actionLoading={actionLoading}
        hasCooked={hasCooked}
        onStartCooking={() => setIsCookMode(true)}
        onShowFridge={() => setShowFridgeModal(true)}
        isLiked={isLiked}
        likesCount={likesCount}
        onToggleLike={handleLike}
        likeLoading={likeLoading}
      />

      {isCookMode && (
        <RecipeCookMode
          recipe={recipe}
          userIngredients={userIngredients}
          preparedIngredients={preparedIngredients}
          completedSteps={completedSteps}
          onTogglePrepared={togglePreparedIngredient}
          onToggleStepComplete={toggleStepComplete}
          onStartTimer={startTimer}
          timerActive={timerActive}
          timerPaused={timerPaused}
          timerSeconds={timerSeconds}
          onToggleTimerPause={toggleTimerPause}
          onStopTimer={stopTimer}
          onClose={() => setIsCookMode(false)}
          hasCooked={hasCooked}
        />
      )}

      {/* 리뷰 섹션 */}
      <RecipeRatings
        recipeId={id}
        averageRating={recipe.average_rating}
        ratingsCount={recipe.ratings_count}
        currentUserId={userId}
        hasCooked={hasCooked}
        onRatingUpdate={refreshRecipeRatings}
      />

      {/* 댓글 섹션 */}
      <RecipeComments
        recipeId={id}
        currentUserId={userId}
      />

      {/* 냉장고 모달 */}
      {showFridgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowFridgeModal(false)}>
          <div className="relative mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFridgeModal(false)}
              className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background-tertiary border border-white/10 hover:bg-background-secondary transition-all shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <InteractiveFridge />
          </div>
        </div>
      )}

      {/* 리뷰 모달 */}
      {reviewModalOpen && (
        <RecipeReviewModal
          recipeId={id}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={async () => {
            setReviewModalOpen(false);
            // 리뷰 정보 다시 로드
            try {
              const response = await fetch(`/api/recipes/${id}/rating`);
              if (response.ok) {
                const data = await response.json();
                setUserRating(data.rating);
                setUserReview(data.review);
              }
            } catch (error) {
              console.error('Error reloading review:', error);
            }
          }}
          initialRating={userRating}
          initialReview={userReview}
        />
      )}
    </div>
  );
}
