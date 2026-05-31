import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetchAll';
import { NextRequest, NextResponse } from 'next/server';

function hasKorean(s: string): boolean {
  return /[가-힣]/.test(s);
}

interface RawProduct {
  name: string;
  // 영수증에서 추출. 확인 불가 시 null (CLAUDE.md 데이터 무결성 — 추정 금지).
  price: number | null;
  quantity: number | null;
  unit: string | null;
}

// OCR 텍스트에서 상품명 + 가격·수량·단위 추출 (가격을 버리지 않음)
function extractProductLines(rawText: string): RawProduct[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const products: RawProduct[] = [];
  const seen = new Set<string>();

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

    // --- 가격 추출: "1,234원" 우선, 없으면 줄 끝 금액 패턴 ---
    let price: number | null = null;
    const wonMatch = line.match(/([\d,]{2,})\s*원/);
    if (wonMatch) {
      const n = parseInt(wonMatch[1].replace(/,/g, ''), 10);
      if (Number.isFinite(n) && n >= 100) price = n;
    }
    if (price === null) {
      const tailMatch = line.match(/([\d,]{3,})\s*[Ss]?$/);
      if (tailMatch) {
        const n = parseInt(tailMatch[1].replace(/,/g, ''), 10);
        if (Number.isFinite(n) && n >= 100) price = n;
      }
    }

    // --- 수량·용량·단위 추출 ---
    let quantity: number | null = null;
    let unit: string | null = null;
    const qtyMatch = line.match(/([\d.]+)\s*(kg|g|ml|l|개|팩|봉|병|통|장|매)\b/i);
    if (qtyMatch) {
      const q = parseFloat(qtyMatch[1]);
      if (Number.isFinite(q) && q > 0) {
        quantity = q;
        unit = qtyMatch[2].toLowerCase();
      }
    }

    // --- 상품명 추출 (가격·수량·특수문자 제거) ---
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
      if (seen.has(cleaned)) continue;
      seen.add(cleaned);
      products.push({ name: cleaned, price, quantity, unit });
    }
  }

  return products;
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
  parsedPrice: number | null;     // 영수증에서 추출한 가격(원) — 가격 리포트 저장용
  parsedQuantity: number | null;  // 추출한 수량/용량
  parsedUnit: string | null;      // 추출한 단위
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

  // 영수증 매칭 위해 전체 재료 필요 — fetchAllRows 로 1000행 silent 절단 방지
  let ingredients: IngredientRow[];
  try {
    ingredients = await fetchAllRows<IngredientRow>(() => supabase
      .from('ingredients_master')
      .select('id, name, category, common_units')
      .order('search_count', { ascending: false, nullsFirst: false }));
  } catch {
    return NextResponse.json({ error: '재료 DB 조회 실패' }, { status: 500 });
  }

  // 각 상품 줄에 대해 재료 매칭 시도
  const productLines: ProductLine[] = rawProducts.map(p => {
    const ing = findIngredient(p.name, ingredients);
    return {
      text: p.name,
      ingredientId: ing?.id ?? null,
      ingredientName: ing?.name ?? null,
      category: ing?.category ?? 'other',
      common_units: ing?.common_units ?? [],
      parsedPrice: p.price,
      parsedQuantity: p.quantity,
      parsedUnit: p.unit,
    };
  });

  return NextResponse.json({ productLines });
}
