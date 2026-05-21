'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { type Profile, type ProfileCounts, type Recipe, type Tip, type TabType } from './_components/types';
import ProfileCard from './_components/ProfileCard';
import ProfileTabs from './_components/ProfileTabs';
import TipsGrid from './_components/TipsGrid';
import DraftsPrivateView from './_components/DraftsPrivateView';
import ProfileRecipeGrid from './_components/ProfileRecipeGrid';

const RecipeReviewModal = dynamic(() => import('@/components/RecipeReviewModal'), { ssr: false });
import BottomNav from '@/components/BottomNav';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage(props: PageProps) {
  const resolvedParams = use(props.params);
  const rawSegment = resolvedParams.username;

  // 프로필 URL은 `/@username` 형식만 유효.
  // `@` 또는 URL-encoded `%40`이 없으면 존재하지 않는 경로이므로 not-found.tsx 렌더.
  // (이전엔 /random-string도 이 route에 매칭되어 "userNotFound" UI + 200 status가 떴음)
  if (!rawSegment.startsWith('@') && !rawSegment.startsWith('%40')) {
    notFound();
  }

  const username = rawSegment.replace('@', '').replace('%40', '');

  const { t } = useI18n();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<ProfileCounts>({ tips: 0, drafts: 0, private: 0 });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [menuOpenRecipeId, setMenuOpenRecipeId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipePage, setRecipePage] = useState(1);
  const [recipeTotalPages, setRecipeTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // URL에서 tab 파라미터 읽기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabType;
      if (tabParam && ['created', 'saved', 'cooked', 'tips', 'drafts', 'private'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setCounts(data.counts || { tips: 0, drafts: 0, private: 0 });
        setRecipes(data.recipes || []);
        setInterests(data.interests || []);
        setDietaryPreferences(data.dietaryPreferences || []);
        setAllergies(data.allergies || []);
        setIsOwnProfile(data.isOwnProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchRecipes = useCallback(async (type: TabType, page = 1, append = false) => {
    if (!profile) return;

    if (append) {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/users/${username}/recipes?type=${type}&page=${page}&limit=30`);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response');
        return;
      }

      const data = await res.json();
      if (append) {
        setRecipes(prev => [...prev, ...(data.recipes || [])]);
      } else {
        setRecipes(data.recipes || []);
      }
      setRecipePage(page);
      setRecipeTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [username, profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchTips = useCallback(async (type: 'published' | 'drafts' | 'private') => {
    if (!profile) return;
    setTipsLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/tips?type=${type}&limit=24`);
      const data = await res.json();
      setTips(data.tips || []);
    } catch (e) {
      console.error('Error fetching tips:', e);
    } finally {
      setTipsLoading(false);
    }
  }, [username, profile]);

  useEffect(() => {
    if (!profile) return;
    setTips([]);
    if (activeTab === 'tips') {
      setRecipes([]);
      fetchTips('published');
    } else if (activeTab === 'drafts') {
      setRecipePage(1);
      fetchRecipes('drafts', 1);
      fetchTips('drafts');
    } else if (activeTab === 'private') {
      setRecipePage(1);
      fetchRecipes('private', 1);
      fetchTips('private');
    } else {
      setRecipePage(1);
      fetchRecipes(activeTab, 1);
    }
  }, [activeTab, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || recipePage >= recipeTotalPages) return;
    if (!['created', 'saved', 'cooked', 'drafts', 'private'].includes(activeTab)) return;
    fetchRecipes(activeTab, recipePage + 1, true);
  }, [loadingMore, recipePage, recipeTotalPages, activeTab, fetchRecipes]);

  useEffect(() => {
    if (loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadMore]);

  const handleDeleteCooked = async (recipeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지

    if (!confirm(t.profile.deleteCookedConfirm)) {
      return;
    }

    try {
      const res = await fetch(`/api/recipes/${recipeId}/cooked`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // 목록에서 제거
        setRecipes(recipes.filter(r => r.id !== recipeId));
      } else {
        const data = await res.json();
        toast.error(data.error || t.errors.deleteFailed);
      }
    } catch (error) {
      console.error('Error deleting cooked recipe:', error);
      toast.error(t.errors.deleteError);
    }
  };

  const handleOpenReview = (recipe: Recipe, e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    setSelectedRecipe(recipe);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewModalOpen(false);
    setSelectedRecipe(null);
    // 레시피 목록 다시 불러오기
    fetchRecipes(activeTab);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm(t.recipe.deleteConfirm)) {
      return;
    }

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t.errors.recipeDeleteFailed);
      }

      // 목록에서 제거
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      setProfile(prev => prev ? { ...prev, recipes_count: prev.recipes_count - 1 } : null);
      toast.success(t.recipe.recipeDeleted);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error(error instanceof Error ? error.message : t.errors.recipeDeleteFailed);
    }
    setMenuOpenRecipeId(null);
  };

  const handleToggleVisibility = async (recipeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'private' : 'published';
    try {
      const res = await fetch(`/api/recipes/${recipeId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t.errors.visibilityChangeFailed);
      }

      // 목록 업데이트
      setRecipes(prev => prev.map(r =>
        r.id === recipeId ? { ...r, status: newStatus } : r
      ));
      toast.success(currentStatus === 'published' ? t.errors.recipeHidden : t.errors.recipePublished);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error(error instanceof Error ? error.message : t.errors.visibilityChangeFailed);
    }
    setMenuOpenRecipeId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-bounce text-2xl text-accent-warm">낼름...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center text-text-primary px-4">
        <div className="text-center">
          <div className="text-5xl md:text-6xl mb-4">🤔</div>
          <p className="text-lg md:text-xl font-bold mb-2">{t.profile.userNotFound}</p>
          <Link href="/" className="text-accent-warm hover:underline">{t.profile.goHome}</Link>
        </div>
      </div>
    );
  }

  const allTabs: { key: TabType; label: string; icon: string; ownerOnly?: boolean; visibleWhen?: boolean }[] = [
    { key: 'created', label: t.profile.createdTab, icon: '📖' },
    { key: 'tips', label: t.profile.tabTips, icon: '💡' },
    { key: 'drafts', label: t.profile.tabDrafts, icon: '📝', ownerOnly: true },
    { key: 'private', label: t.profile.tabPrivate, icon: '🔒', ownerOnly: true },
    { key: 'saved', label: t.profile.savedTab, icon: '👅', visibleWhen: isOwnProfile || !!profile.show_saved_to_public },
    { key: 'cooked', label: t.profile.cookedTab, icon: '🎉', visibleWhen: isOwnProfile || !!profile.show_cooked_to_public },
  ];
  const tabs = allTabs.filter(tab => {
    if (tab.ownerOnly) return isOwnProfile;
    if (tab.visibleWhen !== undefined) return tab.visibleWhen;
    return true;
  });

  // ProfileTabs onClick 본문 — setActiveTab + URL pushState (원본 byte-identical)
  const handleSelectTab = (key: TabType) => {
    setActiveTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', key);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24 md:pb-8">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-background-primary/95 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto max-w-4xl px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <Link href="/" className="text-xl font-bold text-accent-warm">낼름</Link>
            {isOwnProfile ? (
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              >
                <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            ) : (
              <div className="w-6" />
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        {/* Modern Profile Card — _components/ProfileCard.tsx 로 추출 (Phase 2) */}
        <ProfileCard
          t={t}
          profile={profile}
          counts={counts}
          isOwnProfile={isOwnProfile}
          interests={interests}
          dietaryPreferences={dietaryPreferences}
          allergies={allergies}
        />

        {/* Tabs — _components/ProfileTabs.tsx 로 추출 (Phase 2) */}
        <ProfileTabs tabs={tabs} activeTab={activeTab} onSelectTab={handleSelectTab} />

        {/* 팁 탭 — _components/TipsGrid.tsx 로 추출 (Phase 2) */}
        {activeTab === 'tips' && (
          <TipsGrid t={t} tips={tips} tipsLoading={tipsLoading} isOwnProfile={isOwnProfile} />
        )}

        {/* 임시저장 / 비공개 탭 — _components/DraftsPrivateView.tsx 로 추출 (Phase 2) */}
        {(activeTab === 'drafts' || activeTab === 'private') && (
          <DraftsPrivateView
            t={t}
            activeTab={activeTab}
            recipes={recipes}
            tips={tips}
            tipsLoading={tipsLoading}
            recipePage={recipePage}
            recipeTotalPages={recipeTotalPages}
            loadMore={loadMore}
            loadingMore={loadingMore}
          />
        )}

        {/* Content Grid — _components/ProfileRecipeGrid.tsx 로 추출 (Phase 2 최대 블록).
            상태·async 핸들러는 부모 소유 그대로 — 콜백만 전달. JSX byte-identical */}
        <ProfileRecipeGrid
          t={t}
          recipes={recipes}
          activeTab={activeTab}
          isOwnProfile={isOwnProfile}
          menuOpenRecipeId={menuOpenRecipeId}
          setMenuOpenRecipeId={setMenuOpenRecipeId}
          onDeleteCooked={handleDeleteCooked}
          onOpenReview={handleOpenReview}
          onDeleteRecipe={handleDeleteRecipe}
          onToggleVisibility={handleToggleVisibility}
          sentinelRef={sentinelRef}
          loadingMore={loadingMore}
        />

        {recipes.length === 0 && ['saved', 'cooked'].includes(activeTab) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-text-muted text-lg">
              {activeTab === 'saved' && t.profile.noSavedRecipes}
              {activeTab === 'cooked' && t.profile.noCookedRecipes}
            </p>
          </div>
        )}
      </div>

      {/* 리뷰 모달 */}
      {selectedRecipe && (
        <RecipeReviewModal
          recipeId={selectedRecipe.id}
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedRecipe(null);
          }}
          onSuccess={handleReviewSuccess}
          initialRating={selectedRecipe.user_rating}
          initialReview={selectedRecipe.user_review || ''}
        />
      )}
      <BottomNav />
    </div>
  );
}
