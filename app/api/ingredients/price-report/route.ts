import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 단위별 정규화 — 비교 가능하게 100g / 100ml / 개당 가격으로 통일.
// 확인 불가(수량·단위 없음, 미지원 단위)면 null (CLAUDE.md 데이터 무결성).
function computePricePerUnit(
  price: number,
  quantity: number | null,
  unit: string | null
): number | null {
  if (!quantity || quantity <= 0 || !unit) return null;
  const u = unit.toLowerCase();
  const round = (n: number) => Math.round(n * 100) / 100;
  switch (u) {
    case 'g':  return round((price / quantity) * 100);          // 100g당
    case 'kg': return round((price / (quantity * 1000)) * 100);
    case 'ml': return round((price / quantity) * 100);          // 100ml당
    case 'l':  return round((price / (quantity * 1000)) * 100);
    case '개': case '팩': case '봉': case '병':
    case '통': case '장': case '매':
      return round(price / quantity);                            // 개당
    default:
      return null;
  }
}

interface Body {
  ingredientId: string;
  price: number;
  quantity?: number | null;
  unit?: string | null;
  purchaseDate?: string | null;
  storeId?: string | null;
  source?: 'receipt' | 'manual';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json() as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { ingredientId, price } = body;
  if (!ingredientId || typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'invalid_price' }, { status: 400 });
  }

  const quantity = typeof body.quantity === 'number' && body.quantity > 0 ? body.quantity : null;
  const unit = body.unit?.trim() || null;
  const pricePerUnit = computePricePerUnit(price, quantity, unit);

  const { error } = await supabase.from('ingredient_price_reports').insert({
    ingredient_id: ingredientId,
    store_id: body.storeId ?? null,
    user_id: user.id,
    price: Math.round(price),
    quantity,
    unit,
    price_per_unit: pricePerUnit,
    purchase_date: body.purchaseDate ?? null,
    source: body.source === 'manual' ? 'manual' : 'receipt',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, pricePerUnit });
}
