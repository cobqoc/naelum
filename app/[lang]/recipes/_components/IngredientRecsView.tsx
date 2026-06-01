'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { type RecipeWithMatch } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import RecipeCard from '@/components/RecipeCard';

type IngMode = 'auto' | 'ready' | 'almost' | 'all';

/**
 * 재료 기반 추천 — /recipes 의 "재료 기반" 탭 콘텐츠.
 * 구 RecommendationsClient(type=ingredients)에서 추출 — 모드 pill(바로/거의/전체) + 결과 그리드.
 * 트렌딩/맞춤추천/식사시간별은 /api/recommendations 의 type 케이스로 코드 보존(UI 미노출).
 * 페이지 chrome(Header/Footer/BottomNav)은 호스트(AllRecipesClient)가 소유.
 */
export default function IngredientRecsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const MODE_OPTIONS: { key: Exclude<IngMode, 'auto'>; icon: string; label: string; desc: string }[] = [
    { key: 'ready',  icon: '🔥', label: t.recommendations.modeReadyLabel,  desc: t.recommendations.modeReadyDesc },
    { key: 'almost', icon: '🛒', label: t.recommendations.modeAlmostLabel, desc: t.recommendations.modeAlmostDesc },
    { key: 'all',    icon: '📋', label: t.recommendations.modeAllLabel,    desc: t.recommendations.modeAllDesc },
  ];

  const [mode, setMode] = useState<IngMode>((searchParams.get('mode') as IngMode) || 'auto');
  const [recommendations, setRecommendations] = useState<RecipeWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // 빈 결과(터미널) 시 dead-end 회피용 인기 레시피 fallback
  const [fallback, setFallback] = useState<RecipeWithMatch[]>([]);
  const [fallbackTried, setFallbackTried] = useState(false);

  const fetchRecommendations = useCallback(async (modeVal: IngMode) => {
    setLoading(true);
    setMessage('');
    try {
      // 비로그인 체험: URL ingredients= 파라미터 or localStorage 데모 재료를 API에 전달
      let extraParams = `&mode=${modeVal}`;
      const urlIngredients = searchParams.get('ingredients');
      if (urlIngredients) {
        extraParams += `&ingredients=${encodeURIComponent(urlIngredients)}`;
      } else {
        try {
          const saved = localStorage.getItem('naelum_demo_items');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const names = parsed.map((i: { ingredient_name: string }) => i.ingredient_name).filter(Boolean);
              if (names.length > 0) extraParams += `&ingredients=${encodeURIComponent(names.join(','))}`;
            }
          }
        } catch { /* localStorage 접근 실패 무시 */ }
      }
      const res = await fetch(`/api/recommendations?type=ingredients&limit=20${extraParams}`);
      const data = await res.json();

      // auto 모드였으면 서버가 선택한 resolvedMode를 상태에 반영 (pill UI 하이라이트)
      if (modeVal === 'auto' && data.mode && data.mode !== 'auto') {
        setMode(data.mode);
      }

      if (data.error) {
        setMessage(data.error);
        setRecommendations([]);
      } else if (data.message) {
        setMessage(data.message);
        setRecommendations([]);
      } else {
        let recipeList = data.recommendations || [];
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && recipeList.length > 0) {
          const recipeIds = recipeList.map((r: RecipeWithMatch) => r.id);
          const { data: cookedSessions } = await supabase
            .from('cooking_sessions')
            .select('recipe_id')
            .eq('user_id', authUser.id)
            .in('recipe_id', recipeIds)
            .not('completed_at', 'is', null);
          const cookedRecipeIds = new Set(cookedSessions?.map(s => s.recipe_id) || []);
          recipeList = recipeList.map((r: RecipeWithMatch) => ({ ...r, has_cooked: cookedRecipeIds.has(r.id) }));
        }
        setRecommendations(recipeList);
      }
    } catch {
      setMessage(t.recommendations.loadFailed);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [t.recommendations.loadFailed, searchParams]);

  useEffect(() => {
    fetchRecommendations(mode);
  }, [mode, fetchRecommendations]);

  // 결과가 비면(매칭 0 등 터미널 상태) 인기 레시피를 1회 로드 → dead-end 대신 제안
  useEffect(() => {
    if (loading || recommendations.length > 0 || fallbackTried) return;
    setFallbackTried(true);
    fetch('/api/recommendations?type=personalized&limit=10')
      .then(r => r.json())
      .then(d => setFallback(Array.isArray(d.recommendations) ? d.recommendations : []))
      .catch(() => { /* fallback 실패는 조용히 무시 */ });
  }, [loading, recommendations.length, fallbackTried]);

  // "딱 맞는 건 없지만 이런 거 어때요" 제안 스트립 (빈 상태 공통)
  const fallbackStrip = fallback.length > 0 ? (
    <div className="mt-10 text-left">
      <h2 className="text-sm font-bold text-text-primary mb-3 px-0.5">{t.recommendations.fallbackTitle}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {fallback.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} showAuthor />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div>
      {/* 모드 pill 필터 */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {MODE_OPTIONS.map(opt => {
            const active = mode === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-accent-warm text-background-primary shadow-md shadow-accent-warm/30'
                    : 'bg-background-secondary text-text-secondary hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
        {(() => {
          const activeOpt = MODE_OPTIONS.find(o => o.key === mode);
          return activeOpt ? <p className="mt-2 text-xs text-text-muted px-1">{activeOpt.desc}</p> : null;
        })()}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-bounce text-4xl">🍳</div>
        </div>
      ) : message ? (
        <>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-text-muted mb-4">{message}</p>
            <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold">
              {t.recommendations.registerIngredients}
            </Link>
          </div>
          {fallbackStrip}
        </>
      ) : recommendations.length === 0 ? (
        mode === 'ready' || mode === 'almost' ? (
          // 부족 0/거의 빈 결과 → 더 넓은 mode 로 안내 (cascade)
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            {mode === 'ready' ? (
              <>
                <p className="text-text-primary font-medium mb-2">{t.recommendations.emptyReadyTitle}</p>
                <p className="text-text-muted text-sm mb-6">{t.recommendations.emptyReadyHint}</p>
                <button
                  onClick={() => setMode('almost')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  {t.recommendations.emptyReadyCta}
                </button>
              </>
            ) : (
              <>
                <p className="text-text-primary font-medium mb-2">{t.recommendations.emptyAlmostTitle}</p>
                <p className="text-text-muted text-sm mb-6">{t.recommendations.emptyAlmostHint}</p>
                <button
                  onClick={() => setMode('all')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  {t.recommendations.emptyAlmostCta}
                </button>
              </>
            )}
          </div>
        ) : (
          // 전체 mode 도 매칭 0 → dead-end 대신 인기 레시피 제안
          <>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-text-primary font-medium mb-1">{t.recommendations.emptyAllTitle}</p>
              <p className="text-text-muted text-sm">{t.recommendations.emptyAllHint}</p>
            </div>
            {fallbackStrip}
          </>
        )
      ) : (
        <div>
          <p className="text-xs text-text-muted mb-3 px-0.5">
            {t.recommendations.resultCount.replace('{count}', String(recommendations.length))}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {recommendations.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} showAuthor />
            ))}
          </div>
          {/* 비로그인 회원가입 CTA */}
          {!user && recommendations.length > 0 && (
            <div className="mt-8 p-5 md:p-6 rounded-2xl bg-gradient-to-br from-accent-warm/15 to-accent-warm/5 border border-accent-warm/30 text-center">
              <div className="text-3xl mb-2" aria-hidden="true">👅</div>
              <h2 className="text-base md:text-lg font-bold text-text-primary mb-1.5">
                {t.recommendations.signupCtaTitle}
              </h2>
              <p className="text-xs md:text-sm text-text-secondary mb-4 leading-relaxed max-w-md mx-auto">
                {t.recommendations.signupCtaDesc}
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover active:scale-95 transition-all shadow-md shadow-accent-warm/30"
              >
                <span>✨</span>
                <span>{t.recommendations.signupCtaButton}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
