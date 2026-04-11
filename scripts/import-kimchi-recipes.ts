/**
 * 세계김치연구소 김치콘텐츠통합플랫폼 레시피 임포트 스크립트
 * Playwright로 JS 렌더링 후 innerText 파싱
 *
 * 실행: npx tsx scripts/import-kimchi-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const ODCLOUD_API_KEY = process.env.DATA_GO_KR_API_KEY!;
const ODCLOUD_URL = 'https://api.odcloud.kr/api/15035943/v1/uddi:99c81169-63b9-444a-a963-ca855d0b5135';
const WIKIM_BASE = 'https://www.wikim.re.kr';

// ============================================================
// 타입
// ============================================================

interface OdcloudItem {
  연번: string;
  '레시피 제목': string;
  키워드: string;
  제작기관: string;
  자료출처: string;
  기록언어: string;
  전체문서내용: string;
  링크: string;
}

interface ParsedIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string;
  notes: string | null;
  is_optional: boolean;
  display_order: number;
}

interface ParsedStep {
  step_number: number;
  instruction: string;
  image_url: string | null;
}

// ============================================================
// 유틸
// ============================================================

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractAiSeq(url: string): string | null {
  const match = url.match(/ai_seq=(\d+)/);
  return match ? match[1] : null;
}

// ============================================================
// 파싱 함수
// ============================================================

/*
 * wikim.re.kr 페이지 innerText 구조:
 * ...
 * 재료
 * 홍갓 2kg  무 200g  쪽파 500g  ...  ← 공백 2개 이상으로 구분된 한 줄
 * 조리 방법
 * 1. 홍갓은 통째로 다듬어 씻고...
 *
 * 2. 무는 1cm 두께로 썰고...
 *
 * 완성
 * 추가 정보
 * ...
 */

const UNIT_PAT = /^(.+?)\s+(\d+\.?\d*)\s*(kg|g|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|스푼|알|T|t|cc|리터|그램)\s*(.*)$/;

function parseIngredients(text: string): ParsedIngredient[] {
  let section = '';

  // 형식 A: 재료\n[재료한줄]\n조리 방법
  const startA = text.indexOf('\n재료\n');
  const endA = text.search(/\n조리\s*방법\n/);
  if (startA !== -1 && endA !== -1 && startA < endA) {
    section = text.slice(startA + 4, endA).trim();
  }

  // 형식 B: 만드는 방법\n[재료한줄]\n조리방법 (퓨전/응용요리)
  if (!section) {
    const startB = text.search(/\n만드는\s*방법\n/);
    const endB = text.search(/\n조리방법\n/);
    if (startB !== -1 && endB !== -1 && startB < endB) {
      const raw = text.slice(startB, endB);
      // 첫 번째 재료처럼 보이는 줄 찾기
      const lines = raw.split('\n').filter(l => l.trim());
      const ingLine = lines.find(l => /\d+\s*(g|ml|개|큰술|작은술|약간)/.test(l));
      if (ingLine) section = ingLine.trim();
    }
  }

  if (!section) return [];

  const ingredients: ParsedIngredient[] = [];
  let order = 1;

  // 공백 2개 이상으로 분리 (한 줄에 모든 재료)
  const parts = section.split(/\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);

  for (const part of parts) {
    const m = UNIT_PAT.exec(part);
    if (m) {
      ingredients.push({
        ingredient_name: m[1].trim(),
        quantity: parseFloat(m[2]),
        unit: m[3],
        notes: m[4]?.trim() || null,
        is_optional: false,
        display_order: order++,
      });
    } else if (part.length >= 2 && part.length <= 40) {
      // 단위 없는 재료 (약간 등)
      ingredients.push({
        ingredient_name: part.replace(/\s+(약간|적당량|조금|소량)$/, '').trim(),
        quantity: null,
        unit: '약간',
        notes: null,
        is_optional: false,
        display_order: order++,
      });
    }
    if (order > 30) break;
  }

  return ingredients;
}

function parseSteps(text: string): ParsedStep[] {
  const endMarkers = ['\n완성', '\n추가 정보', '\n목록', '\n콘텐츠 정보', '\n* Tip', '\n영양 정보'];
  const steps: ParsedStep[] = [];

  function clipSection(raw: string): string {
    let end = raw.length;
    for (const m of endMarkers) {
      const idx = raw.indexOf(m);
      if (idx !== -1 && idx < end) end = idx;
    }
    return raw.slice(0, end);
  }

  // 형식 A: 번호 붙은 단계 (1. 2. 3.)
  const startA = text.search(/\n조리\s*방법\n/);
  if (startA !== -1) {
    const section = clipSection(text.slice(startA));
    const stepPattern = /(?:^|\n)\s*(\d+)\.\s+([^\n]+(?:\n(?!\s*\d+\.).*)*)/g;
    let match: RegExpExecArray | null;
    while ((match = stepPattern.exec(section)) !== null) {
      const instruction = match[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (instruction.length > 5) {
        steps.push({ step_number: parseInt(match[1]), instruction, image_url: null });
      }
      if (steps.length >= 20) break;
    }
    if (steps.length > 0) return steps;
  }

  // 형식 B: <단계명> 스타일 (퓨전/응용요리)
  const startB = text.search(/\n조리방법\n/);
  if (startB !== -1) {
    const section = clipSection(text.slice(startB));
    // "<단계명>" 뒤에 오는 텍스트를 단계로 추출
    const parts = section.split(/\n<[^>]+>\n?/).filter(p => p.trim().length > 5);
    parts.forEach((p, i) => {
      const instruction = p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (instruction.length > 5 && instruction.length < 500) {
        steps.push({ step_number: i + 1, instruction, image_url: null });
      }
    });
    if (steps.length > 0) return steps;
  }

  // 형식 C: 번호 없는 단락들 (기타)
  const startC = text.search(/\n(?:만드는\s*방법|조리\s*방법|조리방법)\n/);
  if (startC !== -1) {
    const section = clipSection(text.slice(startC + 1));
    const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 10 && l.length < 300);
    // 재료처럼 보이는 줄 제외
    const stepLines = lines.filter(l => !/^\d+\s*g|^\d+\s*ml|^[가-힣]+\s+\d+/.test(l));
    stepLines.slice(0, 15).forEach((l, i) => {
      steps.push({ step_number: i + 1, instruction: l, image_url: null });
    });
  }

  return steps;
}

// ============================================================
// 공공 API 목록 수집
// ============================================================

async function fetchCatalog(): Promise<OdcloudItem[]> {
  const allItems: OdcloudItem[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = `${ODCLOUD_URL}?page=${page}&perPage=${perPage}&serviceKey=${ODCLOUD_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`공공 API 오류 ${res.status}`);
    const json = await res.json();
    const items: OdcloudItem[] = json.data ?? [];
    allItems.push(...items);
    if (allItems.length >= json.totalCount || items.length < perPage) break;
    page++;
  }
  return allItems;
}

// ============================================================
// 태그 생성
// ============================================================

function buildTags(item: OdcloudItem, title: string): string[] {
  const tags: Set<string> = new Set(['한식', '김치', 'Kimchi', 'KoreanFood']);
  if (item.키워드) {
    item.키워드.split(/[,;/·#]/).map(k => k.trim())
      .filter(k => k.length >= 2 && k.length <= 20)
      .forEach(k => tags.add(k));
  }
  if (/볶음/.test(title)) tags.add('볶음요리');
  if (/찌개|국/.test(title)) tags.add('국물요리');
  if (/김치/.test(title)) tags.add('발효음식');
  return [...tags].slice(0, 10);
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('🥬 세계김치연구소 레시피 임포트 (Playwright)\n');

  // 관리자 로그인
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  });
  if (authError || !authData.user) { console.error('❌ 로그인 실패'); process.exit(1); }
  const ADMIN_USER_ID = authData.user.id;
  console.log(`✅ 관리자: ${ADMIN_USER_ID}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 카탈로그 수집
  console.log('📡 카탈로그 수집 중...');
  const catalog = await fetchCatalog();
  const withLinks = catalog.filter(item => item.링크?.trim());
  console.log(`✅ ${withLinks.length}개 항목\n`);

  // Playwright 브라우저 시작
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const pw = await context.newPage();
  console.log('🌐 Chromium 준비 완료\n');

  // 이미 임포트된 ai_seq 수집 (중복 방지)
  const { data: existing } = await supabase
    .from('recipes')
    .select('thumbnail_url')
    .ilike('thumbnail_url', '%wikim%');
  const existingSeqs = new Set(
    (existing ?? []).map(r => extractAiSeq(r.thumbnail_url ?? '')).filter(Boolean)
  );
  console.log(`이미 임포트된 항목: ${existingSeqs.size}개\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < withLinks.length; i++) {
    const item = withLinks[i];
    const title = (item['레시피 제목'] ?? '').trim();
    const link = item.링크.trim();
    if (!title) { skipped++; continue; }

    // 이미 임포트된 항목 스킵
    const aiSeqCheck = extractAiSeq(link);
    if (aiSeqCheck && existingSeqs.has(aiSeqCheck)) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${withLinks.length}] ${title} ... `);

    try {
      await pw.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
      const pageText = await pw.evaluate(() => document.body.innerText);

      const ingredients = parseIngredients(pageText);
      const steps = parseSteps(pageText);

      if (steps.length === 0) {
        console.log('⏭️  단계 없음, 스킵');
        skipped++;
        await sleep(300);
        continue;
      }

      const aiSeq = extractAiSeq(link);
      const thumbnail_url = aiSeq
        ? `${WIKIM_BASE}/archiveThumbImgView.es?mid=a50301040100&ai_seq=${aiSeq}`
        : null;

      // description: 페이지에서 설명 텍스트 추출 (제목 아래 첫 단락)
      const descMatch = pageText.match(new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\n]*\n([^\n]{20,200})`));
      const description = descMatch
        ? descMatch[1].trim()
        : `${title} 레시피입니다.${item['키워드'] ? ' ' + item['키워드'] : ''}`;

      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          author_id: ADMIN_USER_ID,
          title,
          description,
          thumbnail_url,
          cuisine_type: 'korean',
          dish_type: 'side',
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id').single();

      if (recipeErr || !recipe) {
        console.log(`❌ DB 오류: ${recipeErr?.message}`);
        failed++;
        continue;
      }

      const rid = recipe.id;

      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(ing => ({ recipe_id: rid, ...ing }))
        );
      }

      await supabase.from('recipe_steps').insert(
        steps.map(s => ({ recipe_id: rid, step_number: s.step_number, instruction: s.instruction, image_url: null }))
      );

      const tags = buildTags(item, title);
      if (tags.length > 0) {
        await supabase.from('recipe_tags')
          .insert(tags.map(tag => ({ recipe_id: rid, tag })))
          .then(() => {});
      }

      console.log(`✅ 재료 ${ingredients.length}개, 단계 ${steps.length}개`);
      success++;
    } catch (err) {
      console.log(`❌ ${err}`);
      failed++;
    }

    await sleep(800);
  }

  await browser.close();

  console.log('\n──────────────────────────────────');
  console.log(`✅ 성공: ${success}개`);
  console.log(`⏭️  스킵: ${skipped}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log('──────────────────────────────────\n');
}

main();
