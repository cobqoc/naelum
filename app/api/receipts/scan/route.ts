import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { parseReceiptLines } from '@/lib/services/receiptParser';
import { matchIngredients } from '@/lib/services/ingredientMatcher';
import { NextRequest, NextResponse } from 'next/server';

// 영수증 OCR 자체는 클라이언트(Tesseract.js, 브라우저 WebAssembly)에서 처리.
// 서버는 OCR 결과(텍스트 라인 배열)만 받아 파싱 + ingredients_master 매칭 담당.
// → 외부 API 비용 0, 이미지 업로드·저장 부담 없음.

const RECEIPT_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1시간
  maxRequests: 30, // OCR 자체가 클라이언트라 서버 호출 넉넉하게
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const rl = await checkRateLimit(`receipt_scan:${user.id}`, RECEIPT_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '영수증 스캔 요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  let body: { lines?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: 'OCR 텍스트 라인이 필요합니다.' }, { status: 400 });
  }

  const lines = body.lines
    .filter((l): l is string => typeof l === 'string')
    .slice(0, 500); // 과도한 입력 방지

  try {
    const parsed = parseReceiptLines(lines);

    if (parsed.items.length === 0) {
      return NextResponse.json(
        { error: '영수증에서 상품 항목을 찾지 못했어요. 더 선명한 사진으로 다시 시도해주세요.' },
        { status: 422 }
      );
    }

    // ingredients_master와 매칭 (서버 사이드 Supabase 접근)
    const itemNames = parsed.items.map((item) => item.itemName);
    const matches = await matchIngredients(supabase, itemNames);

    const results = parsed.items.map((item, index) => ({
      rawText: item.rawText,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      ingredient: matches[index].ingredient,
      confidence: matches[index].confidence,
    }));

    return NextResponse.json({
      items: results,
      store: parsed.store,
      date: parsed.date,
    });
  } catch (error) {
    console.error('영수증 파싱 오류:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `영수증 파싱 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
