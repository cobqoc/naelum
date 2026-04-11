import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { createOcrProvider } from '@/lib/services/receiptOcr';
import { parseReceipt } from '@/lib/services/receiptParser';
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

  // 1. 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  // 2. Rate limit 체크
  const rateLimitResult = await checkRateLimit(
    `receipt_scan:${user.id}`,
    RECEIPT_SCAN_RATE_LIMIT
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: '영수증 스캔 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  try {
    // 3. FormData에서 이미지 추출
    const formData = await request.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '영수증 이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 4. 파일 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG 또는 PNG 이미지만 지원합니다.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 5. OCR 처리
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const ocrProvider = createOcrProvider();
    const ocrResult = await ocrProvider.recognize(imageBuffer, file.type);

    if (!ocrResult.lines.length) {
      return NextResponse.json(
        { error: '영수증에서 텍스트를 인식하지 못했습니다. 더 선명한 사진으로 다시 시도해주세요.' },
        { status: 422 }
      );
    }

    // 6. 영수증 파싱
    const parsed = parseReceipt(ocrResult.lines);

    if (parsed.items.length === 0) {
      return NextResponse.json(
        { error: '영수증에서 재료 항목을 찾지 못했습니다.' },
        { status: 422 }
      );
    }

    // 7. 재료 매칭
    const itemNames = parsed.items.map((item) => item.itemName);
    const matches = await matchIngredients(supabase, itemNames);

    // 8. 결과 조합
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
      ocrProvider: ocrResult.provider,
    });
  } catch (error) {
    console.error('영수증 스캔 오류:', error);

    const message = error instanceof Error ? error.message : '알 수 없는 오류';

    // OCR 서비스 설정 오류는 별도 처리
    if (message.includes('환경변수')) {
      return NextResponse.json(
        { error: 'OCR 서비스가 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '영수증 스캔 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
