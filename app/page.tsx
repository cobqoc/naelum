import { createClient } from '@/lib/supabase/server';
import HomeClient, { type FeedItem } from './HomeClient';

const INITIAL_RECIPES = 8;
const INITIAL_TIPS = 4;

async function fetchHomeData() {
  const supabase = await createClient();

  // 초기 피드만 병렬로 fetch — 트렌딩은 클라이언트에서 requestIdleCallback으로 로드
  const [recipesResult, tipsResult] = await Promise.all([
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

  return { initialFeed };
}

export default async function Home() {
  let initialFeed: FeedItem[] = [];

  try {
    const data = await fetchHomeData();
    initialFeed = data.initialFeed;
  } catch {
    // 서버 fetch 실패 시 클라이언트에서 직접 로드
  }

  return (
    <HomeClient
      initialFeed={initialFeed}
      initialTrending={[]}
      initialFeedOffset={initialFeed.length > 0 ? INITIAL_RECIPES : 0}
    />
  );
}
