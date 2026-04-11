/**
 * 기존 DB 레시피의 부정확한 필드를 null로 업데이트
 * - servings: 1 → null (식약처 API에서 인분 정보 없이 하드코딩된 값)
 * - prep_time_minutes, cook_time_minutes, difficulty_level: 이미 null이면 그대로
 *
 * 실행: npx tsx scripts/fix-existing-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

async function main() {
  console.log('🔧 기존 레시피 데이터 수정 시작\n');

  // 1. 관리자 로그인하여 UUID 확인
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error('❌ 관리자 로그인 실패:', authError?.message);
    process.exit(1);
  }

  const ADMIN_USER_ID = authData.user.id;
  console.log(`✅ 관리자 UUID: ${ADMIN_USER_ID}\n`);

  // 2. Service Role 클라이언트
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3. 관리자 레시피 중 servings = 1인 것을 null로 업데이트
  console.log('📋 servings = 1 → null 업데이트 중...');
  const { data: updated, error: updateError } = await supabase
    .from('recipes')
    .update({ servings: null })
    .eq('author_id', ADMIN_USER_ID)
    .eq('servings', 1)
    .select('id', { count: 'exact' });

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ ${updated?.length ?? 0}개 레시피의 servings를 null로 업데이트 완료\n`);

  // 4. 확인
  const { data: check } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', ADMIN_USER_ID)
    .eq('servings', 1);

  console.log(`📊 남은 servings = 1 레시피: ${check?.length ?? 0}개`);

  // 5. 전체 관리자 레시피 null 필드 현황
  const { count: totalCount } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', ADMIN_USER_ID);

  const { count: nullServings } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', ADMIN_USER_ID)
    .is('servings', null);

  const { count: nullPrepTime } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', ADMIN_USER_ID)
    .is('prep_time_minutes', null);

  const { count: nullDifficulty } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', ADMIN_USER_ID)
    .is('difficulty_level', null);

  console.log('\n📊 관리자 레시피 현황:');
  console.log(`  전체: ${totalCount}개`);
  console.log(`  servings = null: ${nullServings}개`);
  console.log(`  prep_time_minutes = null: ${nullPrepTime}개`);
  console.log(`  difficulty_level = null: ${nullDifficulty}개`);
  console.log('\n✅ 완료!');
}

main().catch(console.error);
