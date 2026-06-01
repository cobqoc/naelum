import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { containsBadWords } from '@/lib/utils/badWordsFilter';
import { levenshteinSimilarity } from '@/lib/utils/levenshtein';
import { ingredientCreationLimiter } from '@/lib/utils/rateLimit';
import { requireAuth } from '@/lib/api/auth';
import { suggestEmoji } from '@/lib/constants/ingredientEmoji';

/**
 * POST /api/ingredients/create
 * 새 재료 추가 API (사용자 크라우드소싱)
 * 추가된 재료는 pending 상태로 저장되어 관리자 승인 대기
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient(); // async 제거

    // 1. 인증 확인
    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 2. Rate limiting (1분에 3개까지)
    try {
      await ingredientCreationLimiter.check(3, user.id);
    } catch {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 3. 요청 데이터 파싱
    const body = await request.json();
    const { name, name_en, category, common_units, allergens } = body;

    // 4. 기본 검증
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '재료명을 입력해주세요' },
        { status: 400 }
      );
    }

    // 길이 체크
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: '재료명은 2~50자여야 합니다' },
        { status: 400 }
      );
    }

    // 5. 욕설 필터
    if (containsBadWords(name)) {
      console.warn(`Profanity detected in ingredient name: "${name}" by user ${user.id}`);
      return NextResponse.json(
        { error: '부적절한 단어가 포함되어 있습니다' },
        { status: 400 }
      );
    }

    // 영문명도 체크
    if (name_en && containsBadWords(name_en)) {
      return NextResponse.json(
        { error: '부적절한 단어가 포함되어 있습니다' },
        { status: 400 }
      );
    }

    // 6. 특수문자 제한
    const nameRegex = /^[가-힣a-zA-Z0-9\s\-()]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: '허용되지 않은 문자가 포함되어 있습니다' },
        { status: 400 }
      );
    }

    // 7. 중복 체크 (Levenshtein distance)
    const firstTwoChars = name.substring(0, 2);
    const { data: existing } = await supabase
      .from('ingredients_master')
      .select('id, name, name_ko')
      .or(`name.ilike.${firstTwoChars}%,name_ko.ilike.${firstTwoChars}%`)
      .limit(20);

    if (existing && existing.length > 0) {
      // 유사도 계산
      for (const item of existing) {
        const mainSimilarity = levenshteinSimilarity(item.name, name);
        const koSimilarity = item.name_ko
          ? levenshteinSimilarity(item.name_ko, name)
          : 0;
        const maxSimilarity = Math.max(mainSimilarity, koSimilarity);

        // 80% 이상 유사하면 중복으로 간주
        if (maxSimilarity > 0.8) {
          return NextResponse.json(
            {
              error: '비슷한 재료가 이미 있습니다',
              similar: item.name_ko || item.name,
            },
            { status: 409 }
          );
        }
      }
    }

    // 8. 카테고리 검증 — V2 확장 (egg·legume·fermented·processed, 2026-05-30 oil·sweetener, 2026-05-31 mushroom·seaweed 추가)
    const validCategories = [
      'veggie',
      'fruit',
      'meat',
      'seafood',
      'egg',
      'grain',
      'dairy',
      'legume',
      'fermented',
      'seasoning',
      'condiment',
      'oil',
      'sweetener',
      'mushroom',
      'seaweed',
      'nuts',
      'alcohol',
      'seeds',
      'spice',
      'beverage',
      'snack',
      'bakery',
      'processed',
      'other',
    ];

    const categoryValue = category || 'other';
    if (!validCategories.includes(categoryValue)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다' },
        { status: 400 }
      );
    }

    // 8-b. 알레르겐 검증 — 식약처 22품목 표준 키만 허용
    const { ALLERGEN_KEY_SET } = await import('@/lib/constants/allergens');
    const allergensValue: string[] = Array.isArray(allergens)
      ? Array.from(new Set(
          allergens
            .filter((a: unknown): a is string => typeof a === 'string')
            .filter((a: string) => ALLERGEN_KEY_SET.has(a)),
        ))
      : [];

    // 9. emoji 자동 추정 (적합한 게 없으면 빈 문자열 — 박스 폴백 X)
    const autoEmoji = suggestEmoji(name);

    // 10. DB INSERT — V2: data_source='user_added' + allergens + emoji 자동
    const { data: newIngredient, error: insertError } = await adminSupabase
      .from('ingredients_master')
      .insert({
        name,
        name_ko: name,
        name_en: name_en || null,
        category: categoryValue,
        emoji: autoEmoji || null,
        common_units: common_units || [],
        allergens: allergensValue,
        search_count: 0,
        status: 'pending',
        data_source: 'user_added',
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ERROR] Insert failed:', insertError);
      console.error('[ERROR] Error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: insertError.message || '재료 추가 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ingredient: newIngredient,
      message: '재료가 추가되었습니다. 관리자 승인 후 모든 사용자가 사용할 수 있습니다.',
    });
  } catch (error) {
    console.error('Unexpected error in ingredient creation:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
