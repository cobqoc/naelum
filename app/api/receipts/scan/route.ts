import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { recognizeReceipt } from '@/lib/services/geminiVision';
import { matchIngredients } from '@/lib/services/ingredientMatcher';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const RECEIPT_SCAN_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1시간
  maxRequests: 10,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. 인증
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 2. Rate limit
  const rateLimitResult = await checkRateLimit(`receipt_scan:${user.id}`, RECEIPT_SCAN_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: '영수증 스캔 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  try {
    // 3. 파일 수신·검증
    const formData = await request.formData();
    const file = formData.get('receipt') as File | null;
    if (!file) {
      return NextResponse.json({ error: '영수증 이미지가 필요합니다.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'JPG 또는 PNG 이미지만 지원합니다.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
    }

    // 4. Gemini Vision — OCR + 구조화 JSON 한 번에
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const parsed = await recognizeReceipt(imageBuffer, file.type);

    if (parsed.items.length === 0) {
      return NextResponse.json(
        { error: '영수증에서 상품 항목을 찾지 못했습니다. 더 선명한 사진으로 다시 시도해주세요.' },
        { status: 422 }
      );
    }

    // 5. ingredients_master와 매칭
    const itemNames = parsed.items.map((item) => item.itemName);
    const matches = await matchIngredients(supabase, itemNames);

    // 6. 응답 조합 (ReceiptScanner 컴포넌트 기존 shape 유지)
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
      ocrProvider: 'gemini',
    });
  } catch (error) {
    console.error('영수증 스캔 오류:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ error: 'OCR 서비스가 설정되지 않았습니다.' }, { status: 503 });
    }
    return NextResponse.json({ error: '영수증 스캔 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
