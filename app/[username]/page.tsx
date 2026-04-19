'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import SafeImage from '@/components/Common/SafeImage';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';

const RecipeReviewModal = dynamic(() => import('@/components/RecipeReviewModal'), { ssr: false });
import BottomNav from '@/components/BottomNav';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  recipes_count: number;
  created_at: string;
  show_saved_to_public?: boolean;
  show_cooked_to_public?: boolean;
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  thumbnail_url: string | null;
  display_image: string | null;
  average_rating: number;
  views_count: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: string;
  created_at: string;
  status: string;
  completed_at?: string; // for cooked recipes
  completion_photo_url?: string | null; // for cooked recipes - user's completion photo
  author?: { username: string; avatar_url: string | null }; // for saved/cooked recipes
  user_rating?: number; // for cooked recipes - user's review rating
  user_review?: string | null; // for cooked recipes - user's review text
  has_cooked?: boolean; // whether current user has cooked this recipe
  save_notes?: string | null; // personal memo on saved recipes
}

interface PageProps {
  params: Promise<{ username: string }>;
}

type TabType = 'created' | 'saved' | 'cooked' | 'tips' | 'drafts' | 'private';

interface Tip {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  views_count: number;
  is_public: boolean;
  is_draft: boolean;
  created_at: string;
}

const TIP_CATEGORY_ICONS: Record<string, string> = {
  '손질법': '🔪', '보관법': '🧊', '조리법': '🍳',
  '도구 사용법': '🥄', '계량법': '⚖️', '기타': '💡',
};

// 시간 차이 계산 함수
function getTimeAgo(dateString: string, notifications: { minutesAgo: string; hoursAgo: string; daysAgo: string; monthsAgo: string; yearsAgo: string }): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 60) return `${diffMins}${notifications.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${notifications.hoursAgo}`;
  if (diffDays < 30) return `${diffDays}${notifications.daysAgo}`;
  if (diffMonths < 12) return `${diffMonths}${notifications.monthsAgo}`;
  return `${diffYears}${notifications.yearsAgo}`;
}

// 관심사 이모지 매핑
const interestEmojis: Record<string, string> = {
  '한식': '🍚',
  '중식': '🥟',
  '일식': '🍱',
  '양식': '🍝',
  '이탈리안': '🍕',
  '프렌치': '🥐',
  '멕시칸': '🌮',
  '인도': '🍛',
  '태국': '🍜',
  '비건': '🥗',
  '디저트': '🍰',
  '베이킹': '🥖',
};

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
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [menuOpenRecipeId, setMenuOpenRecipeId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followModalList, setFollowModalList] = useState<{ id: string; username: string; avatar_url: string | null; bio: string | null }[]>([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);
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
        setRecipes(data.recipes || []);
        setInterests(data.interests || []);
        setDietaryPreferences(data.dietaryPreferences || []);
        setAllergies(data.allergies || []);
        setIsFollowing(data.isFollowing);
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

  const openFollowModal = async (type: 'followers' | 'following') => {
    setFollowModal(type);
    setFollowModalLoading(true);
    setFollowModalList([]);
    try {
      const res = await fetch(`/api/users/${username}/${type}`);
      if (res.ok) {
        const data = await res.json();
        setFollowModalList(type === 'followers' ? (data.followers || []) : (data.following || []));
      }
    } catch {
      // ignore
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.warning(t.errors.loginRequired);
      return;
    }

    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setIsFollowing(data.following);
        setProfile(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + (data.following ? 1 : -1)
        } : null);
      }
    } catch (error) {
      console.error('Error following:', error);
    } finally {
      setFollowLoading(false);
    }
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
    { key: 'tips', label: '팁', icon: '💡' },
    { key: 'drafts', label: '임시저장', icon: '📝', ownerOnly: true },
    { key: 'private', label: '비공개', icon: '🔒', ownerOnly: true },
    { key: 'saved', label: t.profile.savedTab, icon: '👅', visibleWhen: isOwnProfile || !!profile.show_saved_to_public },
    { key: 'cooked', label: t.profile.cookedTab, icon: '🎉', visibleWhen: isOwnProfile || !!profile.show_cooked_to_public },
  ];
  const tabs = allTabs.filter(tab => {
    if (tab.ownerOnly) return isOwnProfile;
    if (tab.visibleWhen !== undefined) return tab.visibleWhen;
    return true;
  });

  const hasExtraInfo = interests.length > 0 || dietaryPreferences.length > 0 || allergies.length > 0;

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
        {/* Modern Profile Card */}
        <div className="mt-8 bg-gradient-to-br from-background-secondary to-background-tertiary rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-background-tertiary overflow-hidden ring-4 ring-accent-warm/30 shadow-lg">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5">
                  👤
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">@{profile.username}</h1>
              {profile.bio && (
                <p className="text-text-secondary text-base mb-4 max-w-xl">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-6 mb-6">
                <div className="text-center md:text-left">
                  <div className="font-bold text-2xl text-accent-warm">{profile.recipes_count}</div>
                  <div className="text-text-muted text-sm">{t.profile.recipes}</div>
                </div>
                <button
                  onClick={() => openFollowModal('followers')}
                  className="text-center md:text-left hover:opacity-75 transition-opacity"
                >
                  <div className="font-bold text-2xl text-accent-warm">{profile.followers_count}</div>
                  <div className="text-text-muted text-sm">{t.profile.followers}</div>
                </button>
                <button
                  onClick={() => openFollowModal('following')}
                  className="text-center md:text-left hover:opacity-75 transition-opacity"
                >
                  <div className="font-bold text-2xl text-accent-warm">{profile.following_count}</div>
                  <div className="text-text-muted text-sm">{t.profile.following}</div>
                </button>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex-1 md:flex-initial md:px-8 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-background-primary border border-white/10 hover:bg-background-secondary'
                        : 'bg-accent-warm text-background-primary hover:bg-accent-hover shadow-lg shadow-accent-warm/20'
                    }`}
                  >
                    {followLoading ? '...' : isFollowing ? t.profile.following : t.profile.follow}
                  </button>
                  <button className="px-5 py-3 rounded-xl bg-background-primary border border-white/10 hover:bg-background-secondary transition-all active:scale-95">
                    💬
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {hasExtraInfo && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="space-y-4">
                {interests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.interestsLabel}</h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1.5 rounded-lg bg-accent-warm/10 text-accent-warm text-sm font-medium border border-accent-warm/20"
                        >
                          {interestEmojis[interest] || ''} {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dietaryPreferences.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.dietaryLabel}</h3>
                    <div className="flex flex-wrap gap-2">
                      {dietaryPreferences.map((pref) => (
                        <span
                          key={pref}
                          className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium border border-success/20"
                        >
                          ✓ {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {allergies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.allergyLabel}</h3>
                    <div className="flex flex-wrap gap-2">
                      {allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="px-3 py-1.5 rounded-lg bg-error/10 text-error text-sm font-medium border border-error/20"
                        >
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                const url = new URL(window.location.href);
                url.searchParams.set('tab', tab.key);
                window.history.pushState({}, '', url);
              }}
              className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                activeTab === tab.key
                  ? 'bg-background-secondary text-accent-warm border-b-2 border-accent-warm'
                  : 'text-text-muted hover:text-text-primary hover:bg-background-secondary/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 팁 탭 */}
        {activeTab === 'tips' && (
          <div className="mt-6">
            {tipsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-background-secondary animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* 팁 작성 카드 */}
                {isOwnProfile && (
                  <Link
                    href="/tip/new"
                    className="group relative rounded-2xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 overflow-hidden border-2 border-dashed border-accent-warm/50 hover:border-accent-warm transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="aspect-square flex flex-col items-center justify-center p-6">
                      <div className="w-20 h-20 rounded-full bg-accent-warm/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-accent-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-accent-warm font-bold text-center">팁 작성하기</p>
                      <p className="text-text-muted text-xs text-center mt-2">노하우를 공유해보세요</p>
                    </div>
                  </Link>
                )}
                {tips.map(tip => (
                  <Link key={tip.id} href={`/tip/${tip.id}`} className="group rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all">
                    <div className="aspect-square relative bg-background-tertiary flex items-center justify-center">
                      {tip.thumbnail_url ? (
                        <SafeImage src={tip.thumbnail_url} alt={tip.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-5xl">{TIP_CATEGORY_ICONS[tip.category] || '💡'}</span>
                      )}
                      {!tip.is_public && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm">🔒 비공개</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-text-primary font-bold text-sm line-clamp-2 mb-1">{tip.title}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="px-1.5 py-0.5 rounded bg-background-tertiary">{tip.category}</span>
                        {tip.duration_minutes && <span>⏱ {tip.duration_minutes}분</span>}
                        <span>👁 {tip.views_count}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {tips.length === 0 && !isOwnProfile && (
                  <div className="col-span-2 md:col-span-3 text-center py-20">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-text-muted text-lg">아직 공유한 팁이 없어요</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 임시저장 / 비공개 탭 */}
        {(activeTab === 'drafts' || activeTab === 'private') && (
          <div className="mt-6 space-y-8">
            {/* 레시피 섹션 */}
            <div>
              <h3 className="text-sm font-bold text-text-muted mb-3">
                {activeTab === 'drafts' ? '📝 임시저장된 레시피' : '🔒 비공개 레시피'}
                {recipes.length > 0 && <span className="ml-2 text-accent-warm">{recipes.length}</span>}
              </h3>
              {recipes.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recipes.map(recipe => (
                      <Link key={recipe.id} href={`/recipes/${recipe.id}/edit`} className="group rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all">
                        <div className="aspect-square relative bg-background-tertiary flex items-center justify-center">
                          {recipe.display_image ? (
                            <SafeImage src={recipe.display_image} alt={recipe.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <span className="text-5xl">🍽️</span>
                          )}
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm">
                            {activeTab === 'drafts' ? '📝 임시저장' : '🔒 비공개'}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-text-primary font-bold text-sm line-clamp-2">{recipe.title}</p>
                          <p className="text-xs text-accent-warm mt-1">탭하여 수정하기 →</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {recipePage < recipeTotalPages && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-full border border-white/10 text-sm text-text-secondary hover:border-accent-warm/50 hover:text-accent-warm transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? '불러오는 중...' : '더 보기'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-text-muted text-sm py-4">없음</p>
              )}
            </div>

            {/* 팁 섹션 */}
            <div>
              <h3 className="text-sm font-bold text-text-muted mb-3">
                {activeTab === 'drafts' ? '📝 임시저장된 팁' : '🔒 비공개 팁'}
                {tips.length > 0 && <span className="ml-2 text-accent-warm">{tips.length}</span>}
              </h3>
              {tipsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-background-secondary animate-pulse" />)}
                </div>
              ) : tips.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tips.map(tip => (
                    <Link key={tip.id} href={`/tip/${tip.id}`} className="group rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all">
                      <div className="aspect-square relative bg-background-tertiary flex items-center justify-center">
                        {tip.thumbnail_url ? (
                          <SafeImage src={tip.thumbnail_url} alt={tip.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-5xl">{TIP_CATEGORY_ICONS[tip.category] || '💡'}</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-text-primary font-bold text-sm line-clamp-2">{tip.title}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-background-tertiary text-text-muted">{tip.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm py-4">없음</p>
              )}
            </div>
          </div>
        )}

        {/* Content Grid (레시피·저장·만들어봤어요 탭) */}
        {['created', 'saved', 'cooked'].includes(activeTab) && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* 레시피 작성 카드 (본인 프로필 + created 탭일 때만) */}
          {isOwnProfile && activeTab === 'created' && (
            <Link
              href="/recipes/new"
              className="group relative rounded-2xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 overflow-hidden border-2 border-dashed border-accent-warm/50 hover:border-accent-warm transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="aspect-square flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-accent-warm/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-accent-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-accent-warm font-bold text-center">{t.recipe.writeRecipe}</p>
                <p className="text-text-muted text-xs text-center mt-2">{t.recipe.writeRecipeSub}</p>
              </div>
            </Link>
          )}

          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group relative rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all"
            >
              <Link href={`/recipes/${recipe.id}`} className="block">
                {/* 이미지 영역 */}
                <div className="aspect-square relative">
                  {/* 만들어본 음식 탭: 완성 사진 우선 표시 */}
                  {activeTab === 'cooked' && recipe.completion_photo_url ? (
                    <SafeImage
                      src={recipe.completion_photo_url}
                      alt={`${recipe.title} 완성 사진`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : recipe.display_image ? (
                    <SafeImage
                      src={recipe.display_image}
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background-tertiary">
                      <span className="text-6xl">🍽️</span>
                    </div>
                  )}

                  {/* 비공개 표시 */}
                  {recipe.status !== 'published' && isOwnProfile && activeTab === 'created' && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm">
                      🔒 비공개
                    </div>
                  )}

                  {/* 만들어봄 배지 */}
                  {activeTab !== 'cooked' && recipe.has_cooked && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
                      ✓ {t.recipe.cooked}
                    </div>
                  )}

                  {/* 만들어본 음식 삭제 버튼 */}
                  {activeTab === 'cooked' && isOwnProfile && (
                    <button
                      onClick={(e) => handleDeleteCooked(recipe.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-error/80 backdrop-blur-sm text-white hover:bg-error transition-all flex items-center justify-center z-10"
                      title={t.common.delete}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* 다른 탭: hover 시에만 정보 표시 */}
                  {activeTab !== 'cooked' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-bold line-clamp-2 mb-2">{recipe.title}</p>
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <span>⭐ {(recipe.average_rating ?? 0).toFixed(1)}</span>
                          <span>👁️ {recipe.views_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 낼름함 탭: 메모가 있으면 표시 */}
                {activeTab === 'saved' && recipe.save_notes && (
                  <div className="p-2.5 bg-background-tertiary border-t border-white/5">
                    <p className="text-xs text-text-secondary line-clamp-2">
                      <span className="text-text-muted">📝</span> {recipe.save_notes}
                    </p>
                  </div>
                )}

                {/* 만들어본 음식 탭: 카드 하단에 정보 항상 표시 */}
                {activeTab === 'cooked' && (
                  <div className="p-3 bg-background-tertiary">
                    <p className="text-text-primary font-bold line-clamp-2 mb-2 text-sm">{recipe.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-2">
                      <span>⭐ {(recipe.average_rating ?? 0).toFixed(1)}</span>
                      <span>👁️ {recipe.views_count ?? 0}</span>
                      {recipe.prep_time_minutes && recipe.cook_time_minutes && (
                        <span>⏱️ {recipe.prep_time_minutes + recipe.cook_time_minutes}분</span>
                      )}
                      {recipe.difficulty_level && (
                        <span>
                          {recipe.difficulty_level === 'easy' ? `🟢 ${t.recipe.easy}` :
                           recipe.difficulty_level === 'medium' ? `🟡 ${t.recipe.medium}` : `🔴 ${t.recipe.hard}`}
                        </span>
                      )}
                    </div>
                    {recipe.completed_at && (
                      <div className="text-xs text-accent-warm font-bold mb-2">
                        🎉 {getTimeAgo(recipe.completed_at, t.notifications)}
                      </div>
                    )}

                    {/* 리뷰 버튼 (본인 프로필에만 표시) */}
                    {isOwnProfile && (
                      <button
                        onClick={(e) => handleOpenReview(recipe, e)}
                        className="w-full py-2 px-3 rounded-lg bg-background-secondary hover:bg-background-primary transition-all text-xs font-bold flex items-center justify-center gap-1"
                      >
                        {recipe.user_rating ? (
                          <>
                            <span>⭐ {recipe.user_rating}점</span>
                            <span>·</span>
                            <span>✏️ 수정</span>
                          </>
                        ) : (
                          <>
                            <span>⭐</span>
                            <span>리뷰 작성하기</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </Link>

              {/* Recipe Management Menu (Own Profile Only) */}
              {isOwnProfile && activeTab === 'created' && (
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setMenuOpenRecipeId(menuOpenRecipeId === recipe.id ? null : recipe.id)}
                    className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-black/90 transition-all flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>

                  {menuOpenRecipeId === recipe.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpenRecipeId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-40 rounded-xl bg-background-primary border border-white/10 shadow-2xl overflow-hidden z-50">
                        <Link
                          href={`/recipes/${recipe.id}/edit`}
                          className="flex items-center gap-2 px-4 py-3 hover:bg-background-secondary transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {t.recipe.modify}
                        </Link>
                        <button
                          onClick={() => handleToggleVisibility(recipe.id, recipe.status)}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-background-secondary transition-colors text-sm text-left"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {recipe.status === 'published' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                          {recipe.status === 'published' ? t.recipe.hide : t.recipe.publish}
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-error/10 transition-colors text-sm text-error text-left"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t.common.delete}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={sentinelRef} className="mt-8 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                <span>{t.common.loading}</span>
              </div>
            )}
          </div>
          </div>
        )}

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

      {/* Followers / Following Modal */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background-secondary overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="font-bold">
                {followModal === 'followers'
                  ? (t.settingsPage?.followersTitle || '팔로워')
                  : (t.settingsPage?.followingTitle || '팔로잉')}
              </h2>
              <button
                onClick={() => { setFollowModal(null); setFollowModalList([]); }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {followModalLoading ? (
                <div className="flex justify-center py-8">
                  <span className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                </div>
              ) : followModalList.length === 0 ? (
                <p className="text-center text-text-muted py-8 text-sm">—</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {followModalList.map(user => (
                    <li key={user.id}>
                      <Link
                        href={`/@${user.username}`}
                        onClick={() => { setFollowModal(null); setFollowModalList([]); }}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-background-tertiary transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-background-tertiary overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">@{user.username}</p>
                          {user.bio && <p className="text-xs text-text-muted truncate">{user.bio}</p>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
