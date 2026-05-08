/**
 * 일본 農林水産省 「うちの郷土料理」 → 낼름 DB 임포트 스크립트
 *
 * 입력: data/maff-recipes-translated.json (번역 완료 파일)
 * 라이선스: PDL1.0 — 출처 표시 필수 (show_source: true)
 * 태그: '農林水産省うちの郷土料理'로 재임포트 시 관리
 *
 * 실행: npx tsx scripts/import-maff-recipes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SOURCE_TAG = '農林水産省うちの郷土料理';
const SOURCE_CHANNEL = '農林水産省 うちの郷土料理';
const BASE_IMG = 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/';

// ──────────────────────────────
// 타입
// ──────────────────────────────

export interface MaffTranslatedRecipe {
  slug: string;
  prefecture: string;       // 鹿児島県 (원본 보존)
  prefectureKo: string;     // 가고시마현
  title: string;            // 한국어 제목
  description: string;      // 한국어 설명
  dishType: string;         // 汁物 → soup 등
  season: string;           // 冬,春 → 한국어 태그
  servings: number;
  images: string[];
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  url: string;
}

// ──────────────────────────────
// 매핑
// ──────────────────────────────

const DISH_TYPE_MAP: Record<string, string> = {
  '汁物': 'soup',
  '飯料理': 'rice',
  '肉／野菜料理': 'main',
  '魚料理': 'main',
  '漬物': 'side',
  '麺料理': 'noodle',
  '菓子': 'dessert',
  '鍋料理': 'soup',
  '乾物料理': 'side',
  '豆腐料理': 'side',
  '卵料理': 'side',
  'その他': 'other',
};

const SEASON_TAG: Record<string, string> = {
  '春': '봄 요리',
  '夏': '여름 요리',
  '秋': '가을 요리',
  '冬': '겨울 요리',
  '通年': '사계절',
};

function parseDishType(raw: string): string {
  if (!raw) return 'other';
  for (const [jp, en] of Object.entries(DISH_TYPE_MAP)) {
    if (raw.includes(jp)) return en;
  }
  return 'other';
}

function parseServings(raw: string): number {
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 2;
}

function buildTags(recipe: MaffTranslatedRecipe): string[] {
  const tags: string[] = [SOURCE_TAG, '일본향토요리'];
  if (recipe.prefectureKo) tags.push(recipe.prefectureKo);
  // 계절 태그
  recipe.season.split(',').forEach(s => {
    const tag = SEASON_TAG[s.trim()];
    if (tag) tags.push(tag);
  });
  return [...new Set(tags)];
}

// ──────────────────────────────
// 메인
// ──────────────────────────────

async function main() {
  const translatedPath = path.join(process.cwd(), 'data/maff-recipes-translated.json');
  if (!fs.existsSync(translatedPath)) {
    console.error('❌ data/maff-recipes-translated.json 파일이 없습니다. 번역 먼저 완료하세요.');
    process.exit(1);
  }

  const recipes: MaffTranslatedRecipe[] = JSON.parse(
    fs.readFileSync(translatedPath, 'utf-8'),
  );
  console.log(`번역 완료 레시피: ${recipes.length}개`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 기존 이 소스 레시피 ID 목록 조회
  const { data: existingTagRows } = await supabase
    .from('recipe_tags')
    .select('recipe_id')
    .eq('tag_name', SOURCE_TAG);

  const existingIds = (existingTagRows ?? []).map(r => r.recipe_id);
  if (existingIds.length > 0) {
    console.log(`기존 ${existingIds.length}개 레시피 삭제 중...`);
    const BATCH = 100;
    for (let i = 0; i < existingIds.length; i += BATCH) {
      const chunk = existingIds.slice(i, i + BATCH);
      const { error } = await supabase.from('recipes').delete().in('id', chunk);
      if (error) { console.error('삭제 오류:', error); process.exit(1); }
    }
  }

  let inserted = 0, skipped = 0;
  const t0 = Date.now();

  for (let idx = 0; idx < recipes.length; idx++) {
    const r = recipes[idx];
    if (!r.title || r.steps.length === 0) { skipped++; continue; }

    const thumbUrl = r.images[0] || null;
    const dishType = parseDishType(r.dishType);
    const servings = parseServings(String(r.servings));

    const { data: rec, error: recErr } = await supabase
      .from('recipes')
      .insert({
        title: r.title,
        description: r.description || null,
        thumbnail_url: thumbUrl,
        servings,
        cuisine_type: 'japanese',
        dish_type: dishType,
        status: 'published',
        published_at: new Date().toISOString(),
        source_url: r.url,
        source_channel: SOURCE_CHANNEL,
        show_source: true,
        author_id: process.env.AUTHOR_ID ?? null,
      })
      .select('id')
      .single();

    if (recErr || !rec) {
      console.error(`  ❌ [${idx + 1}/${recipes.length}] "${r.title}": ${recErr?.message}`);
      continue;
    }

    const dbId = rec.id;

    // 재료 삽입
    if (r.ingredients.length > 0) {
      const ingRows = r.ingredients.map((ing, i) => ({
        recipe_id: dbId,
        ingredient_name: ing.name,
        notes: ing.amount || null,
        display_order: i + 1,
      }));
      const { error: ingErr } = await supabase
        .from('recipe_ingredients')
        .insert(ingRows);
      if (ingErr) console.warn(`  ⚠️ 재료: ${ingErr.message}`);
    }

    // 조리 단계 삽입
    const stepRows = r.steps.map((s, i) => ({
      recipe_id: dbId,
      step_number: i + 1,
      instruction: s,
    }));
    const { error: stepErr } = await supabase.from('recipe_steps').insert(stepRows);
    if (stepErr) console.warn(`  ⚠️ 단계: ${stepErr.message}`);

    // 태그 삽입
    const tags = buildTags(r);
    const { error: tagErr } = await supabase
      .from('recipe_tags')
      .insert(tags.map(t => ({ recipe_id: dbId, tag_name: t })));
    if (tagErr) console.warn(`  ⚠️ 태그: ${tagErr.message}`);

    inserted++;
    if (inserted % 50 === 0 || inserted === 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  ✅ [${idx + 1}/${recipes.length}] "${r.title}" — ${elapsed}초 경과`);
    }
  }

  console.log(`\n완료! 삽입: ${inserted}개, 스킵: ${skipped}개`);
}

main().catch(console.error);
