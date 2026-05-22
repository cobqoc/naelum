'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { type RecipeWithMatch } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import RecipeCard from '@/components/RecipeCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';


type TabType = 'ingredients' | 'personalized' | 'trending' | 'meal_time';
type IngMode = 'auto' | 'ready' | 'almost' | 'all';

export default function RecommendationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const MODE_OPTIONS: { key: Exclude<IngMode, 'auto'>; icon: string; label: string; desc: string }[] = [
    { key: 'ready',  icon: '🔥', label: t.recommendations.modeReadyLabel,  desc: t.recommendations.modeReadyDesc },
    { key: 'almost', icon: '🛒', label: t.recommendations.modeAlmostLabel, desc: t.recommendations.modeAlmostDesc },
    { key: 'all',    icon: '📋', label: t.recommendations.modeAllLabel,    desc: t.recommendations.modeAllDesc },
  ];

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [mode, setMode] = useState<IngMode>((searchParams.get('mode') as IngMode) || 'auto');
  const [recommendations, setRecommendations] = useState<RecipeWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchRecommendations = useCallback(async (type: TabType, modeVal: IngMode) => {
    setLoading(true);
    setMessage('');

    try {
      // 비로그인 체험: URL ingredients= 파라미터 or localStorage에서 데모 재료 읽어 API에 전달
      let extraParams = '';
      if (type === 'ingredients') {
        extraParams = `&mode=${modeVal}`;
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
      }
      const res = await fetch(`/api/recommendations?type=${type}&limit=20${extraParams}`);
      const data = await res.json();

      // auto 모드였으면 서버가 선택한 resolvedMode를 상태에 반영 (pill UI 하이라이트)
      if (type === 'ingredients' && modeVal === 'auto' && data.mode && data.mode !== 'auto') {
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

        // Check if user is logged in and add has_cooked info
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && recipeList.length > 0) {
          const recipeIds = recipeList.map((r: RecipeWithMatch) => r.id);

          const { data: cookedSessions } = await supabase
            .from('cooking_sessions')
            .select('recipe_id')
            .eq('user_id', user.id)
            .in('recipe_id', recipeIds)
            .not('completed_at', 'is', null);

          const cookedRecipeIds = new Set(cookedSessions?.map(s => s.recipe_id) || []);

          recipeList = recipeList.map((r: RecipeWithMatch) => ({
            ...r,
            has_cooked: cookedRecipeIds.has(r.id)
          }));
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
    fetchRecommendations(activeTab, activeTab === 'ingredients' ? mode : 'auto');
  }, [activeTab, mode, fetchRecommendations]);

  // mode 변경 시 URL 쿼리 갱신 (공유/북마크 가능)
  const changeMode = (next: Exclude<IngMode, 'auto'>) => {
    setMode(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', next);
    router.replace(`/recommendations?${params.toString()}`, { scroll: false });
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'ingredients', label: t.recommendations.byIngredients, icon: '🥬' },
    { key: 'personalized', label: t.recommendations.personalized, icon: '✨' },
    { key: 'trending', label: t.recommendations.trending, icon: '🔥' },
    { key: 'meal_time', label: t.recommendations.byMealTime, icon: '⏰' },
  ];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />

      <main className="container mx-auto max-w-4xl px-6 pt-20 md:pt-24 pb-24 md:pb-12">
        <h1 className="text-2xl font-bold mb-4">{t.recommendations.title}</h1>

        {/* 추천 종류 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
        {/* Ingredients mode pill 필터 */}
        {activeTab === 'ingredients' && (
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
              {MODE_OPTIONS.map(opt => {
                const active = mode === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => changeMode(opt.key)}
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
            {/* 현재 mode 설명 */}
            {(() => {
              const activeOpt = MODE_OPTIONS.find(o => o.key === mode);
              return activeOpt ? (
                <p className="mt-2 text-xs text-text-muted px-1">{activeOpt.desc}</p>
              ) : null;
            })()}
          </div>
        )}

        {activeTab === 'meal_time' && (
          <div className="mb-6 p-4 rounded-xl bg-info/10 border border-info/20">
            <p className="text-sm text-text-secondary">
              {t.recommendations.mealTimeDesc}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-bounce text-4xl">🍳</div>
          </div>
        ) : message ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-text-muted">{message}</p>
            {activeTab === 'ingredients' && (
              <Link
                href="/"
                className="mt-4 inline-block px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold"
              >
                {t.recommendations.registerIngredients}
              </Link>
            )}
          </div>
        ) : recommendations.length === 0 && activeTab === 'ingredients' ? (
          // 빈 결과 + mode 전환 CTA
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            {mode === 'ready' ? (
              <>
                <p className="text-text-primary font-medium mb-2">{t.recommendations.emptyReadyTitle}</p>
                <p className="text-text-muted text-sm mb-6">{t.recommendations.emptyReadyHint}</p>
                <button
                  onClick={() => changeMode('almost')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  {t.recommendations.emptyReadyCta}
                </button>
              </>
            ) : mode === 'almost' ? (
              <>
                <p className="text-text-primary font-medium mb-2">{t.recommendations.emptyAlmostTitle}</p>
                <p className="text-text-muted text-sm mb-6">{t.recommendations.emptyAlmostHint}</p>
                <button
                  onClick={() => changeMode('all')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  {t.recommendations.emptyAlmostCta}
                </button>
              </>
            ) : (
              <>
                <p className="text-text-primary font-medium mb-2">{t.recommendations.emptyAllTitle}</p>
                <Link
                  href="/"
                  className="mt-4 inline-block px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold"
                >
                  {t.recommendations.emptyAllCta}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div>
            {recommendations.length > 0 && (
              <p className="text-xs text-text-muted mb-3 px-0.5">
                {t.recommendations.resultCount.replace('{count}', String(recommendations.length))}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recommendations.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} showAuthor />
              ))}
            </div>
            {/* 비로그인 회원가입 CTA — 결과 보고 만족한 사용자가 가입할 수 있게 */}
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

        {recommendations.length === 0 && !loading && !message && activeTab !== 'ingredients' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-text-muted">{t.recommendations.noRecommendations}</p>
          </div>
        )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
