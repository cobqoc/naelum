import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

async function main() {
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { count } = await supabase.from('recipes').select('*', { count: 'exact', head: true });
console.log('Recipe count via service_role:', count);

const { data } = await supabase
  .from('recipes')
  .select('id,title,created_at,video_url')
  .order('created_at', { ascending: false })
  .limit(5);
console.log('Latest 5:');
for (const r of data ?? []) console.log(' ', r.created_at, r.id, r.title);

// 특정 ID 조회
const ids = ['cfb71a63-3003-48a4-a173-b6804f8304a7', 'd1e07886-f275-47b5-987c-66f8fb038f8c', 'b34a8edf-e6e6-4d68-a54c-c7745da2f0b5'];
const { data: byId } = await supabase.from('recipes').select('id,title,created_at').in('id', ids);
console.log(`\nBy IDs (${ids.length} requested): found ${byId?.length ?? 0}`);
for (const r of byId ?? []) console.log(' ', r.id, r.title);
}
main().catch(e => { console.error(e); process.exit(1); });
