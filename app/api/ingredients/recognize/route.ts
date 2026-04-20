import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { recognizeIngredients } from '@/lib/services/geminiVision';
import { matchIngredients } from '@/lib/services/ingredientMatcher';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 이중 캡 (시간당 + 일일) — Gemini 무료 쿼터(일일 1500회 공유) 안전 + 봇 차단.
// 정상 사용자: 장 본 직후 1~5장 사진. 일일 10회면 차고 넘침.
const PHOTO_RECOGNIZE_HOUR = { windowMs: 60 * 60 * 1000, maxRequests: 3 };
const PHOTO_RECOGNIZE_DAY = { windowMs: 24 * 60 * 60 * 1000, maxRequests: 10 };

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 일일 캡 먼저 체크 (더 큰 윈도우 우선 → 시간당 캡은 일일 캡 안 먹은 경우만 의미)
  const rlDay = await checkRateLimit(`ingredient_recognize_day:${user.id}`, PHOTO_RECOGNIZE_DAY);
  if (!rlDay.allowed) {
    return NextResponse.json(
      { error: '오늘 사진 인식 한도를 모두 사용했어요. 내일 다시 시도해주세요.' },
      { status: 429 }
    );
  }
  const rlHour = await checkRateLimit(`ingredient_recognize_hour:${user.id}`, PHOTO_RECOGNIZE_HOUR);
  if (!rlHour.allowed) {
    return NextResponse.json(
      { error: '사진 인식 요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'JPG 또는 PNG 이미지만 지원합니다.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const recognized = await recognizeIngredients(imageBuffer, file.type);

    if (recognized.length === 0) {
      return NextResponse.json(
        { error: '사진에서 식재료를 식별하지 못했습니다. 더 밝고 선명한 사진으로 다시 시도해주세요.' },
        { status: 422 }
      );
    }

    // ingredients_master 매칭으로 카탈로그 id 확보 (가능한 경우만).
    const names = recognized.map((r) => r.name);
    const matches = await matchIngredients(supabase, names);

    const items = recognized.map((r, idx) => ({
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      confidence: r.confidence,
      ingredient: matches[idx].ingredient,
      matchConfidence: matches[idx].confidence,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('재료 사진 인식 오류:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ error: '사진 인식 서비스가 설정되지 않았습니다.' }, { status: 503 });
    }
    // 디버깅용: 실제 에러 메시지를 클라이언트에 노출.
    return NextResponse.json(
      { error: `사진 인식 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
