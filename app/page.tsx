import { createClient } from '@/lib/supabase/server';
import HomeClient, { type RecipeItem, type FeedItem } from './HomeClient';

const INITIAL_RECIPES = 8;
const INITIAL_TIPS = 4;

async function fetchHomeData() {
  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [recipesResult, tipsResult, cookedResult] = await Promise.all([
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
      .from('cooking_sessions')
      .select('recipe_id')
      .not('completed_at', 'is', null)
      .gte('completed_at', weekAgo.toISOString()),
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

  // 트렌딩 레시피 계산 (최근 7일 가장 많이 만들어진 레시피)
  let initialTrending: RecipeItem[] = [];
  const cookedRows = cookedResult.data || [];

  if (cookedRows.length > 0) {
    const cookedCounts = new Map<string, number>();
    cookedRows.forEach(s => {
      cookedCounts.set(s.recipe_id, (cookedCounts.get(s.recipe_id) || 0) + 1);
    });
    const topIds = [...cookedCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => id);

    if (topIds.length > 0) {
      const { data: trendingData } = await supabase
        .from('recipes')
        .select('id, title, thumbnail_url, display_image, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username, avatar_url)')
        .eq('status', 'published')
        .in('id', topIds);

      initialTrending = ((trendingData || []).map(r => ({
        ...r,
        cooked_count: cookedCounts.get(r.id) || 0,
        author: Array.isArray(r.author) ? r.author[0] : r.author,
      })) as RecipeItem[]).sort((a, b) => (b.cooked_count || 0) - (a.cooked_count || 0));
    }
  }

  // 트렌딩 데이터가 없으면 평점 높은 순으로 fallback
  if (initialTrending.length === 0) {
    const { data: fallback } = await supabase
      .from('recipes')
      .select('id, title, thumbnail_url, display_image, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username, avatar_url)')
      .eq('status', 'published')
      .order('average_rating', { ascending: false })
      .limit(4);

    initialTrending = (fallback || []).map(r => ({
      ...r,
      author: Array.isArray(r.author) ? r.author[0] : r.author,
    })) as RecipeItem[];
  }

  return { initialFeed, initialTrending };
}

export default async function Home() {
  let initialFeed: FeedItem[] = [];
  let initialTrending: RecipeItem[] = [];

  try {
    const data = await fetchHomeData();
    initialFeed = data.initialFeed;
    initialTrending = data.initialTrending;
  } catch {
    // 서버 fetch 실패 시 클라이언트에서 직접 로드
  }

  return (
    <HomeClient
      initialFeed={initialFeed}
      initialTrending={initialTrending}
      initialFeedOffset={initialFeed.length > 0 ? INITIAL_RECIPES : 0}
    />
  );
}
