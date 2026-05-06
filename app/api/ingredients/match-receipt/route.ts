import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 한국어 문자가 하나라도 있는지 확인
function hasKorean(s: string): boolean {
  return /[가-힣]/.test(s);
}

// 한글 음절 → 초성/중성/종성 분리
function decomposeKorean(char: string): { initial: number; medial: number; final: number } | null {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  return {
    initial: Math.floor(code / 28 / 21),
    medial: Math.floor(code / 28) % 21,
    final: code % 28,
  };
}

// 두 음절 비교 — OCR 모음 오인식 허용 (받침 있는 글자만)
// - 받침 없는 열린 음절(가/나/바 등)은 정확 매칭 필요
// - 받침 있는 닫힌 음절(귤/글, 밥/밤 등)은 초성+종성만 비교
// 예: "귤"(ㄱ받침ㄹ) ↔ "글"(ㄱ받침ㄹ) → match  /  "사" ↔ "서" → NO match
function consonantMatch(a: string, b: string): boolean {
  const da = decomposeKorean(a);
  const db = decomposeKorean(b);
  if (!da || !db) return a === b;
  // 받침 없는 글자 → 초성+중성 모두 일치해야 함
  if (da.final === 0 || db.final === 0) {
    return da.initial === db.initial && da.medial === db.medial && da.final === db.final;
  }
  // 받침 있는 글자 → 초성+종성만 비교 (OCR 모음 오인식 허용)
  return da.initial === db.initial && da.final === db.final;
}

// ingName의 글자열이 candidate 내 연속 위치에서 자음 패턴으로 매칭되는지 확인
function consonantSeqMatch(ingName: string, candidate: string): boolean {
  const n = ingName.length;
  if (n > candidate.length) return false;
  for (let i = 0; i <= candidate.length - n; i++) {
    let ok = true;
    for (let j = 0; j < n; j++) {
      if (!consonantMatch(ingName[j], candidate[i + j])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// 영수증 한 줄에서 재료 후보 텍스트 추출
function extractCandidates(rawText: string): string[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const candidates: string[] = [];

  for (const line of lines) {
    // 날짜·구분선 스킵
    if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue;
    if (/[-=*─━—]{3,}/.test(line)) continue;

    // 영수증 메타데이터 스킵
    if (/합계|소계|부가세|할인|적립|포인트|카드|현금|승인|총액|잔액|change|vat|tax/i.test(line)) continue;
    if (/사업자|대표|주소|영업일|판매일|담당|영수증|pos:|pos\s/i.test(line)) continue;
    if (/상품명|수량|단가|금액|면세|과세|물품가액|고객|사본/i.test(line)) continue;
    if (/^\d{6,}/.test(line)) continue;
    if (/tel|fax|www\.|http|@/i.test(line)) continue;

    // 가격·수량·노이즈 제거
    const cleaned = line
      .replace(/[\d,]+\s*원/g, '')
      .replace(/[\d.]+\s*(g|kg|ml|l|개|팩|봉|ea|box|set|매|장)/gi, '')
      .replace(/×\s*\d+/g, '')
      .replace(/\b\d{3,}\b/g, '')
      .replace(/[*#§@()\[\]{}|\\\/←→↑↓▶◀■□●○◆◇—–]/g, ' ')
      .replace(/[a-zA-Z]{4,}/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length >= 2 && hasKorean(cleaned) && !/^\d+$/.test(cleaned)) {
      candidates.push(cleaned);
      const tokens = cleaned
        .split(/\s+/)
        .filter(t => t.length >= 2 && hasKorean(t) && !/^\d/.test(t));
      candidates.push(...tokens);
    }
  }

  return [...new Set(candidates)];
}

interface IngredientRow {
  id: string;
  name: string;
  category: string | null;
  common_units: string[] | null;
}

interface MatchedIngredient {
  id: string;
  name: string;
  category: string;
  common_units: string[];
  matchedFrom: string;
}

function matchIngredients(candidates: string[], ingredients: IngredientRow[]): MatchedIngredient[] {
  const matched: MatchedIngredient[] = [];
  const seenIds = new Set<string>();

  for (const candidate of candidates) {
    const candLower = candidate.toLowerCase();

    for (const ing of ingredients) {
      if (seenIds.has(ing.id)) continue;

      const ingName = ing.name.toLowerCase();
      if (ingName.length <= 1) continue;

      // 1) 정방향: 후보 텍스트 안에 재료명이 포함
      const forwardMatch = candLower.includes(ingName);

      // 2) 역방향: 재료명 안에 후보가 포함 — 짧은 후보(≤3자)는 허용하지 않음
      //    ("아이" 같은 OCR 노이즈가 "아이스크림"에 역매칭되는 오류 방지)
      const reverseMatch = ingName.includes(candLower) && candLower.length >= 4;

      // 3) 자음 패턴 매칭: 2~4자 재료명에 한해 OCR 모음 오인식 허용
      //    예: "감귤"(ㄱ_ㄹ ← ㄱ_ㅁ) ↔ "감글"(ㄱ_ㅡ_ㄹ) 매칭
      const useConsonant = ingName.length >= 2 && ingName.length <= 4 && hasKorean(ingName);
      const consonantMatched = useConsonant && consonantSeqMatch(ingName, candLower);

      if (forwardMatch || reverseMatch || consonantMatched) {
        matched.push({
          id: ing.id,
          name: ing.name,
          category: ing.category ?? 'other',
          common_units: ing.common_units ?? [],
          matchedFrom: candidate,
        });
        seenIds.add(ing.id);
      }
    }
  }

  return matched;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json() as { text: string };
  const { text } = body;

  if (!text?.trim()) {
    return NextResponse.json({ matched: [], candidates: [] });
  }

  const candidates = extractCandidates(text);

  if (candidates.length === 0) {
    return NextResponse.json({ matched: [], candidates: [] });
  }

  const { data: ingredients, error } = await supabase
    .from('ingredients_master')
    .select('id, name, category, common_units')
    .order('search_count', { ascending: false, nullsFirst: false });

  if (error || !ingredients) {
    return NextResponse.json({ error: '재료 DB 조회 실패' }, { status: 500 });
  }

  const matched = matchIngredients(candidates, ingredients);

  return NextResponse.json({ matched, candidates });
}
