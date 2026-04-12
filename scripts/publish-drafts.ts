/**
 * Draft 레시피/팁을 공개(publish) 처리하는 스크립트
 *
 * 사용법: echo '{"ids":["id1","id2"],"type":"recipe"}' | npx tsx scripts/publish-drafts.ts
 *         echo '{"ids":["id1"],"type":"tip"}' | npx tsx scripts/publish-drafts.ts
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PublishInput {
  ids: string[];
  type: 'recipe' | 'tip';
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    console.error('ERROR: stdin이 비어있습니다.');
    process.exit(1);
  }

  let input: PublishInput;
  try {
    input = JSON.parse(raw);
  } catch {
    console.error('ERROR: JSON 파싱 실패');
    process.exit(1);
  }

  if (!input.ids?.length || !input.type) {
    console.error('ERROR: ids와 type은 필수입니다.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (input.type === 'recipe') {
    const { data, error } = await supabase
      .from('recipes')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .in('id', input.ids)
      .select('id, title');

    if (error || !data) {
      console.error('ERROR: 레시피 공개 처리 실패:', error?.message || '데이터 없음');
      process.exit(1);
    }

    console.log(`SUCCESS: 레시피 ${data.length}개 공개 처리 완료`);
    data.forEach((r) => console.log(`  - ${r.title} (${r.id})`));
  } else if (input.type === 'tip') {
    const { data, error } = await supabase
      .from('tip')
      .update({ is_public: true })
      .in('id', input.ids)
      .select('id, title');

    if (error || !data) {
      console.error('ERROR: 팁 공개 처리 실패:', error?.message || '데이터 없음');
      process.exit(1);
    }

    console.log(`SUCCESS: 팁 ${data.length}개 공개 처리 완료`);
    data.forEach((t) => console.log(`  - ${t.title} (${t.id})`));
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
