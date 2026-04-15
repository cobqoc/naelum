import { createClient } from '@/lib/supabase/server';
import HomeClient, { type FeedItem, type RecipeItem } from './HomeClient';

const INITIAL_RECIPES = 8;
const INITIAL_TIPS = 4;
const INITIAL_TRENDING = 4;

async function fetchHomeData() {
  const supabase = await createClient();

  // 모든 쿼리를 하나의 Promise.all로 묶어 최대한 병렬 처리.
  // getUser는 내부적으로 Supabase auth 서버에 round trip 발생하므로 다른 쿼리들과 동시에 시작.
  const userPromise = supabase.auth.getUser();

  const [recipesResult, tipsResult, trendingResult, userResult] = await Promise.all([
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
    // 이전엔 홈에서 requestIdleCallback로 클라이언트가 lazy fetch해 섹션이 뒤늦게 랜딩했다.
    // 이제 서버에서 병렬로 같이 가져와 초기 HTML에 포함 → 첫 화면부터 인기 레시피가 보임.
    supabase
      .from('recipes')
      .select('id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, views_count, likes_count, average_rating, author:profiles!recipes_author_id_fkey(username)')
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .range(0, INITIAL_TRENDING - 1),
    userPromise,
  ]);

  const user = userResult.data.user;

  // 로그인 유저의 onboarding_step은 위 쿼리들이 완료된 후 순차 fetch
  // (getUser 없인 user.id를 모르므로 waterfall 불가피. 하지만 다른 쿼리와 병렬로 처리)
  const profileResult = user
    ? await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

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

  return { initialFeed, initialTrending, onboardingStep, isAuthenticated: !!user };
}

export default async function Home() {
  let initialFeed: FeedItem[] = [];
  let initialTrending: RecipeItem[] = [];
  let onboardingStep: number | null = null;
  let isAuthenticated = false;

  try {
    const data = await fetchHomeData();
    initialFeed = data.initialFeed;
    initialTrending = data.initialTrending;
    onboardingStep = data.onboardingStep;
    isAuthenticated = data.isAuthenticated;
  } catch {
    // 서버 fetch 실패 시 클라이언트에서 직접 로드
  }

  return (
    <HomeClient
      initialFeed={initialFeed}
      initialTrending={initialTrending}
      initialFeedOffset={initialFeed.length > 0 ? INITIAL_RECIPES : 0}
      onboardingStep={onboardingStep}
      isAuthenticated={isAuthenticated}
    />
  );
}
