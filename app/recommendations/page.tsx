'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { type RecipeWithMatch } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import FridgeRecipeCard from '@/components/FridgeRecipeCard';
import BottomNav from '@/components/BottomNav';

type TabType = 'ingredients' | 'personalized' | 'trending' | 'meal_time';

export default function RecommendationsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [recommendations, setRecommendations] = useState<RecipeWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchRecommendations = useCallback(async (type: TabType) => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/recommendations?type=${type}&limit=20`);
      const data = await res.json();

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
  }, [t.recommendations.loadFailed]);

  useEffect(() => {
    fetchRecommendations(activeTab);
  }, [activeTab, fetchRecommendations]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'ingredients', label: t.recommendations.byIngredients, icon: '🥬' },
    { key: 'personalized', label: t.recommendations.personalized, icon: '✨' },
    { key: 'trending', label: t.recommendations.trending, icon: '🔥' },
    { key: 'meal_time', label: t.recommendations.byMealTime, icon: '⏰' },
  ];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-secondary/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-text-muted hover:text-text-primary">{t.recommendations.backToHome}</Link>
            <h1 className="text-lg font-bold">{t.recommendations.title}</h1>
            <div className="w-10" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
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
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-6 py-6">
        {/* Info Banner */}
        {activeTab === 'ingredients' && (
          <div className="mb-6 p-4 rounded-xl bg-accent-warm/10 border border-accent-warm/20">
            <p className="text-sm text-text-secondary">
              <span className="font-bold text-accent-warm">{t.recommendations.byIngredients}</span> {t.recommendations.ingredientBasedDesc}
              <Link href="/" className="ml-2 text-accent-warm underline">{t.recommendations.manageIngredients}</Link>
            </p>
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recommendations.map((recipe) => (
              <FridgeRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {recommendations.length === 0 && !loading && !message && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-text-muted">{t.recommendations.noRecommendations}</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
