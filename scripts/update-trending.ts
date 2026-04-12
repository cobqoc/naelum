/**
 * 인기도 기반으로 Featured 레시피를 업데이트하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/update-trending.ts status          # 현재 Featured 목록
 *   npx tsx scripts/update-trending.ts calculate [N]   # 상위 N개 계산 (기본 10)
 *   npx tsx scripts/update-trending.ts update [N]      # Featured 업데이트 적용
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 인기도 점수 계산 (popular_recipes VIEW와 동일한 공식)
function calculateScore(r: { likes_count: number; saves_count: number; views_count: number; average_rating: number }): number {
  return r.likes_count * 2 + r.saves_count * 3 + r.views_count * 0.1 + r.average_rating * 10;
}

async function showStatus() {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, likes_count, saves_count, views_count, average_rating')
    .eq('is_featured', true)
    .eq('status', 'published');

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('현재 Featured 레시피가 없습니다.');
    return;
  }

  console.log(`현재 Featured 레시피: ${data.length}개`);
  data.forEach((r, i) => {
    const score = calculateScore(r);
    console.log(`  ${i + 1}. ${r.title} (점수: ${score.toFixed(1)}) - 좋아요 ${r.likes_count}, 저장 ${r.saves_count}, 조회 ${r.views_count}, 평점 ${r.average_rating}`);
  });
}

async function calculateTop(count: number) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, likes_count, saves_count, views_count, average_rating, is_featured')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .limit(100);

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('공개된 레시피가 없습니다.');
    return;
  }

  const ranked = data
    .map((r) => ({ ...r, score: calculateScore(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  console.log(`인기 레시피 TOP ${count}`);
  ranked.forEach((r, i) => {
    const featured = r.is_featured ? ' ⭐' : '';
    console.log(`  ${i + 1}. ${r.title} (점수: ${r.score.toFixed(1)}) - 좋아요 ${r.likes_count}, 저장 ${r.saves_count}, 조회 ${r.views_count}, 평점 ${r.average_rating}${featured}`);
  });

  // JSON 출력 (다른 스크립트에서 사용 가능)
  console.log(`\nTOP_IDS: ${JSON.stringify(ranked.map((r) => r.id))}`);
}

async function updateFeatured(count: number) {
  // 상위 N개 계산
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, likes_count, saves_count, views_count, average_rating')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error('ERROR:', error?.message || '데이터 없음');
    process.exit(1);
  }

  const ranked = data
    .map((r) => ({ ...r, score: calculateScore(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  const topIds = ranked.map((r) => r.id);

  // 기존 Featured 초기화
  const { error: resetError } = await supabase
    .from('recipes')
    .update({ is_featured: false })
    .eq('is_featured', true);

  if (resetError) {
    console.error('ERROR: Featured 초기화 실패:', resetError.message);
    process.exit(1);
  }

  // 새로운 Featured 설정
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ is_featured: true })
    .in('id', topIds);

  if (updateError) {
    console.error('ERROR: Featured 업데이트 실패:', updateError.message);
    process.exit(1);
  }

  console.log(`SUCCESS: Featured 레시피 ${topIds.length}개 업데이트 완료`);
  ranked.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title} (점수: ${r.score.toFixed(1)})`);
  });
}

async function main() {
  const action = process.argv[2] || 'status';
  const count = parseInt(process.argv[3]) || 10;

  switch (action) {
    case 'status':
      await showStatus();
      break;
    case 'calculate':
      await calculateTop(count);
      break;
    case 'update':
      await updateFeatured(count);
      break;
    default:
      console.error('사용법: npx tsx scripts/update-trending.ts [status|calculate|update] [개수]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
