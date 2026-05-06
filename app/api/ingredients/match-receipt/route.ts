import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 영수증 한 줄에서 재료 후보 텍스트 추출
function extractCandidates(rawText: string): string[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const candidates: string[] = [];

  for (const line of lines) {
    // 날짜·영수증번호·구분선·합계류 스킵
    if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue;
    if (/^[-=*─━─—]{3,}/.test(line)) continue;
    if (/합계|소계|부가세|할인|적립|포인트|카드|현금|승인|총액|잔액|change|vat|tax/i.test(line)) continue;
    if (/^\d{6,}/.test(line)) continue; // 사업자번호 등 긴 숫자
    if (/tel|fax|www\.|http|@/i.test(line)) continue; // 연락처, 주소

    // 가격·수량 제거
    const cleaned = line
      .replace(/[\d,]+\s*원/g, '')
      .replace(/[\d.]+\s*(g|kg|ml|l|개|팩|봉|ea|box|set|매|장)/gi, '')
      .replace(/×\s*\d+/g, '')      // ×3 같은 수량 표기
      .replace(/\b\d{3,}\b/g, '')   // 3자리 이상 숫자 제거
      .replace(/[*#@()\[\]{}|\\\/←→↑↓▶◀■□●○◆◇]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length >= 2 && !/^\d+$/.test(cleaned)) {
      // 공백으로 분리해서 각 토큰도 후보로 추가 (긴 줄에서 재료명 추출)
      candidates.push(cleaned);
      const tokens = cleaned.split(/\s+/).filter(t => t.length >= 2 && !/^\d/.test(t));
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

      // 재료명이 후보에 포함되거나, 후보가 재료명에 포함
      if (candLower.includes(ingName) || ingName.includes(candLower)) {
        // 노이즈 필터: 1글자 한자·특수문자만 있는 경우 스킵
        if (ingName.length === 1) continue;

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
