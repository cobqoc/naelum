import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 현재 사용자명 확인
  const { data: before } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('email', process.env.ADMIN_EMAIL!)
    .single();
  console.log('변경 전:', before);

  // 사용자명 변경
  const { data, error } = await supabase
    .from('profiles')
    .update({ username: '낼름' })
    .eq('email', process.env.ADMIN_EMAIL!)
    .select('id, username, email')
    .single();

  if (error) {
    console.error('❌ 오류:', error.message);
  } else {
    console.log('✅ 변경 후:', data);
  }
}
main();
