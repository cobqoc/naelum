/**
 * 재료 칩 이모지 커버리지 감사.
 *
 * 2026-05-17 칩 fallback 게이트(getPreciseIngredientEmoji) 도입 후속.
 * dev ingredients_master 의 재료명을 precise resolver 에 통과시켜
 * "정확 이모지 미지정(null) → 칩에서 이모지 숨김" 비율과 그 목록을
 * 카테고리별·이름순으로 출력. 자주 빠지는 흔한 재료를 EXACT_MAP 에
 * 보강하는 근거 자료로 사용(폴백 노이즈를 켜는 게 아니라 정확도를 올림).
 *
 * 실행: npx tsx scripts/audit-emoji-coverage.ts
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
import { getPreciseIngredientEmoji } from '../lib/utils/ingredientEmoji';

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ingredients_master 전체 (페이지네이션 — 1000행 제한 회피)
  const names: { name: string; category: string | null }[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('ingredients_master')
      .select('name, category')
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    names.push(...data);
    if (data.length < page) break;
    from += page;
  }

  const seen = new Set<string>();
  let total = 0;
  let missing = 0;
  const missingByCat = new Map<string, string[]>();

  for (const row of names) {
    const nm = (row.name ?? '').trim();
    if (!nm || seen.has(nm)) continue;
    seen.add(nm);
    total++;
    if (getPreciseIngredientEmoji(nm) === null) {
      missing++;
      const cat = row.category ?? '(none)';
      if (!missingByCat.has(cat)) missingByCat.set(cat, []);
      missingByCat.get(cat)!.push(nm);
    }
  }

  const pct = total ? ((total - missing) / total * 100).toFixed(1) : '0';
  console.log(`\n=== 이모지 precise 커버리지 (dev ingredients_master) ===`);
  console.log(`고유 재료명: ${total}`);
  console.log(`precise 매핑 있음: ${total - missing} (${pct}%)`);
  console.log(`precise 없음(칩에서 숨김): ${missing}\n`);

  const cats = [...missingByCat.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [cat, list] of cats) {
    console.log(`── ${cat}  (${list.length}) ──`);
    console.log(list.sort((a, b) => a.localeCompare(b, 'ko')).join(', '));
    console.log('');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
