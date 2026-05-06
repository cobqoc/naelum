import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function hasKorean(s: string): boolean {
  return /[가-힣]/.test(s);
}

// OCR 텍스트에서 상품 줄만 추출 (가격·바코드 줄 제외)
function extractProductLines(rawText: string): string[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const products: string[] = [];

  for (const line of lines) {
    // 한국어 없는 줄 제외
    if (!hasKorean(line)) continue;

    // 구분선·날짜 제외
    if (/[-=*─━—]{3,}/.test(line)) continue;
    if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue;

    // 영수증 메타데이터 제외 (합계·결제·사업자·헤더 등)
    if (/합계|소계|부가세|할인|적립|포인트|카드|현금|승인|총액|잔액/.test(line)) continue;
    if (/사업자|대표자|주소|영업일|판매일|담당|영수증번호|pos:/i.test(line)) continue;
    if (/상품명|수량|단가|금액|면세물품|과세물품|부 가 세/.test(line)) continue;
    if (/tel|fax|www\.|http|@/i.test(line)) continue;

    // 바코드 줄 제외 (숫자로 시작하는 긴 숫자 줄)
    if (/^\d{6,}/.test(line)) continue;

    // 가격·수량·특수문자 제거해서 상품명만 추출
    const cleaned = line
      .replace(/\d{8,}/g, '')                                    // 바코드 번호
      .replace(/[\d,]+\s*원/g, '')                               // 금액
      .replace(/[\d.]+\s*(g|kg|ml|l|개|팩|봉|ea|box|set|매|장)/gi, '') // 용량·수량
      .replace(/\s+\d+\s+[\d,]+\s+[\d,]+\s*[Ss]?$/g, '')       // 수량 단가 금액 (줄 끝)
      .replace(/[*#§@()\[\]{}|\\\/←→—–]/g, ' ')
      .replace(/\b\d{2,}\b/g, '')                                // 남은 숫자들
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length >= 2 && hasKorean(cleaned)) {
      products.push(cleaned);
    }
  }

  return [...new Set(products)];
}

interface IngredientRow {
  id: string;
  name: string;
  category: string | null;
  common_units: string[] | null;
}

export interface ProductLine {
  text: string;                // 파싱된 상품명 (정제된 OCR 텍스트)
  ingredientId: string | null; // 매칭된 재료 ID (없으면 null)
  ingredientName: string | null;
  category: string;
  common_units: string[];
}

function decomposeKorean(char: string): { initial: number; medial: number; final: number } | null {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  return { initial: Math.floor(code / 28 / 21), medial: Math.floor(code / 28) % 21, final: code % 28 };
}

function consonantMatch(a: string, b: string): boolean {
  const da = decomposeKorean(a), db = decomposeKorean(b);
  if (!da || !db) return a === b;
  if (da.final === 0 || db.final === 0)
    return da.initial === db.initial && da.medial === db.medial && da.final === db.final;
  return da.initial === db.initial && da.final === db.final;
}

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

// 상품 텍스트에서 재료 하나 찾기
function findIngredient(productText: string, ingredients: IngredientRow[]): IngredientRow | null {
  const text = productText.toLowerCase();

  // 정방향: 텍스트가 재료명 포함
  for (const ing of ingredients) {
    if (ing.name.length <= 1) continue;
    if (text.includes(ing.name.toLowerCase())) return ing;
  }

  // 자음 패턴: 2~4자 재료, 받침 있는 글자 모음 오인식 허용
  for (const ing of ingredients) {
    if (ing.name.length < 2 || ing.name.length > 4) continue;
    if (!hasKorean(ing.name)) continue;
    if (consonantSeqMatch(ing.name.toLowerCase(), text)) return ing;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json() as { text: string };
  const { text } = body;

  if (!text?.trim()) {
    return NextResponse.json({ productLines: [] });
  }

  const rawProducts = extractProductLines(text);

  if (rawProducts.length === 0) {
    return NextResponse.json({ productLines: [] });
  }

  const { data: ingredients, error } = await supabase
    .from('ingredients_master')
    .select('id, name, category, common_units')
    .order('search_count', { ascending: false, nullsFirst: false });

  if (error || !ingredients) {
    return NextResponse.json({ error: '재료 DB 조회 실패' }, { status: 500 });
  }

  // 각 상품 줄에 대해 재료 매칭 시도
  const productLines: ProductLine[] = rawProducts.map(productText => {
    const ing = findIngredient(productText, ingredients);
    return {
      text: productText,
      ingredientId: ing?.id ?? null,
      ingredientName: ing?.name ?? null,
      category: ing?.category ?? 'other',
      common_units: ing?.common_units ?? [],
    };
  });

  return NextResponse.json({ productLines });
}
