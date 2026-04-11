import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { levenshteinSimilarity } from '@/lib/utils/levenshtein';

/**
 * GET /api/ingredients/check-duplicate
 * 재료명 중복 체크 API
 * Levenshtein distance를 사용하여 유사한 재료를 찾음
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json(
      { error: 'Name parameter is required' },
      { status: 400 }
    );
  }

  if (name.length < 2) {
    return NextResponse.json({ duplicate: false });
  }

  try {
    const supabase = await createClient();

    // 유사한 이름 검색 (첫 2글자 일치하는 것들)
    const firstTwoChars = name.substring(0, 2);

    const { data: candidates, error } = await supabase
      .from('ingredients_master')
      .select('id, name, name_ko')
      .or(`name.ilike.${firstTwoChars}%,name_ko.ilike.${firstTwoChars}%`)
      .limit(20);

    if (error) {
      console.error('Error checking duplicate:', error);
      return NextResponse.json(
        { error: 'Failed to check duplicate' },
        { status: 500 }
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ duplicate: false });
    }

    // 유사도 계산
    const similarities = candidates.map((item) => {
      const mainNameSimilarity = levenshteinSimilarity(item.name, name);
      const koNameSimilarity = item.name_ko
        ? levenshteinSimilarity(item.name_ko, name)
        : 0;

      return {
        ...item,
        similarity: Math.max(mainNameSimilarity, koNameSimilarity),
      };
    });

    // 가장 유사한 항목 찾기
    const mostSimilar = similarities.reduce((prev, current) =>
      prev.similarity > current.similarity ? prev : current
    );

    // 유사도 80% 이상이면 중복으로 판단
    const SIMILARITY_THRESHOLD = 0.8;

    if (mostSimilar.similarity > SIMILARITY_THRESHOLD) {
      return NextResponse.json({
        duplicate: true,
        similar: {
          id: mostSimilar.id,
          name: mostSimilar.name_ko || mostSimilar.name,
        },
        similarity: mostSimilar.similarity,
      });
    }

    return NextResponse.json({ duplicate: false });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
