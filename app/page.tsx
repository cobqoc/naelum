import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware';
import HomeClient, { type FeedItem, type RecipeItem } from './HomeClient';

const INITIAL_RECIPES = 8;
const INITIAL_TIPS = 4;
const INITIAL_TRENDING = 4;
const INITIAL_FRIDGE_RECS = 4;

/**
 * 로그인 유저의 냉장고 기반 추천을 내부 API 라우트를 통해 가져온다.
 * 같은 Vercel 함수 인스턴스 내 loopback 호출이라 오버헤드는 1~10ms 수준.
 * 복잡한 동의어 매칭/알레르기 필터링/substitute 로직 전체가 담긴 250+ 라인
 * 함수를 중복 구현하지 않기 위해 fetch로 재사용한다.
 */
async function fetchFridgeRecommendations(limit: number): Promise<RecipeItem[]> {
  try {
    const h = await headers();
    const host = h.get('host');
    if (!host) return [];
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const cookie = h.get('cookie') ?? '';
    const url = `${proto}://${host}/api/recommendations?type=ingredients&limit=${limit}`;
    const res = await fetch(url, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recommendations) ? data.recommendations : [];
  } catch {
    return [];
  }
}

async function fetchHomeData() {
  const supabase = await createClient();

  // 미들웨어가 이미 getUser를 수행하고 검증된 user.id를 x-naelum-user-id 헤더로 전달한다.
  // 여기서 다시 getUser() 하면 auth 서버 round trip이 중복 발생하므로 헤더에서 읽는다.
  const userId = await getVerifiedUserIdFromHeaders();

  // 로그인 유저라면 fridge 기반 추천도 병렬 batch에 포함 — 이전엔 클라이언트에서
  // requestIdleCallback로 lazy fetch해 섹션이 뒤늦게 랜딩했지만, 이제 첫 HTML에 포함됨.
  const fridgeRecsPromise: Promise<RecipeItem[]> = userId
    ? fetchFridgeRecommendations(INITIAL_FRIDGE_RECS)
    : Promise.resolve([]);

  const profileQuery = userId
    ? supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', userId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [recipesResult, tipsResult, trendingResult, initialFridgeRecs, profileResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, views_count, likes_count, average_rating, author:profiles!recipes_author_id_fkey(username)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(0, INITIAL_RECIPES - 1),
    supabase
      .from('tip')
      .select('id, title, thumbnail_url, category, duration_minutes, author:profiles!tip_author_id_fkey(username)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(0, INITIAL_TIPS - 1),
    supabase
      .from('recipes')
      .select('id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, views_count, likes_count, average_rating, author:profiles!recipes_author_id_fkey(username)')
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .range(0, INITIAL_TRENDING - 1),
    fridgeRecsPromise,
    profileQuery,
  ]);

  // 초기 피드 혼합 (레시피 2개 : 팁 1개 비율)
  const recipeFeed: FeedItem[] = (recipesResult.data || []).map(r => ({
    type: 'recipe' as const,
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));
  const tipFeed: FeedItem[] = (tipsResult.data || []).map(tip => ({
    type: 'tip' as const,
    id: tip.id,
    title: tip.title,
    thumbnail_url: tip.thumbnail_url,
    category: tip.category,
    duration_minutes: tip.duration_minutes,
    author: Array.isArray(tip.author) ? tip.author[0] : tip.author,
  }));
  const initialFeed: FeedItem[] = [];
  let ri = 0, ti = 0;
  while (ri < recipeFeed.length || ti < tipFeed.length) {
    if (ri < recipeFeed.length) initialFeed.push(recipeFeed[ri++]);
    if (ri < recipeFeed.length) initialFeed.push(recipeFeed[ri++]);
    if (ti < tipFeed.length) initialFeed.push(tipFeed[ti++]);
  }

  const initialTrending: RecipeItem[] = (trendingResult.data || []).map(r => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));

  const onboardingStep = profileResult?.data?.onboarding_step ?? null;

  return {
    initialFeed,
    initialTrending,
    initialFridgeRecs,
    onboardingStep,
    isAuthenticated: !!userId,
  };
}

export default async function Home() {
  let initialFeed: FeedItem[] = [];
  let initialTrending: RecipeItem[] = [];
  let initialFridgeRecs: RecipeItem[] = [];
  let onboardingStep: number | null = null;
  let isAuthenticated = false;

  try {
    const data = await fetchHomeData();
    initialFeed = data.initialFeed;
    initialTrending = data.initialTrending;
    initialFridgeRecs = data.initialFridgeRecs;
    onboardingStep = data.onboardingStep;
    isAuthenticated = data.isAuthenticated;
  } catch {
    // 서버 fetch 실패 시 클라이언트에서 직접 로드
  }

  return (
    <HomeClient
      initialFeed={initialFeed}
      initialTrending={initialTrending}
      initialFridgeRecs={initialFridgeRecs}
      initialFeedOffset={initialFeed.length > 0 ? INITIAL_RECIPES : 0}
      onboardingStep={onboardingStep}
      isAuthenticated={isAuthenticated}
    />
  );
}
