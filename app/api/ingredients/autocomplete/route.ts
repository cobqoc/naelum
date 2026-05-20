import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 검색어 확장 맵 — 사용자 의도와 DB 이름이 다른 경우 보강.
 * 예: "기름" 검색 시 "식용유"가 이름에 없어도 결과에 포함.
 * 키는 정확 일치(trim 후)일 때만 트리거.
 */
const SEARCH_EXPANSIONS: Record<string, string[]> = {
  '기름': ['식용유'],
  '오일': ['식용유', '기름'],
  // "라면" 검색 시 라면 제품들 모두 노출 (라면 자체는 pending이라 검색에 안 떠)
  '라면': ['신라면', '진라면', '안성탕면', '짜파게티', '너구리라면', '삼양라면', '비빔면', '불닭볶음면'],
};

// GET /api/ingredients/autocomplete - 재료 자동완성
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  const categoriesParam = searchParams.get('categories'); // 카테고리 필터 파라미터

  if (!query.trim() || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // 검색어 확장: 정확 일치 시 추가 검색어 포함
    const expansions = SEARCH_EXPANSIONS[query.trim()] || [];
    const searchTerms = [query, ...expansions];
    const orConditions = searchTerms.flatMap(term => [
      `name.ilike.%${term}%`,
      `name_ko.ilike.%${term}%`,
      `name_en.ilike.%${term}%`,
    ]).join(',');

    // ingredients_master 테이블에서 재료 검색
    let dbQuery = supabase
      .from('ingredients_master')
      .select('id, name, name_en, name_ko, category, subcategory, image_url, common_units, search_count, emoji')
      .or(orConditions);

    // 카테고리 필터 적용
    if (categoriesParam) {
      const categories = categoriesParam.split(',').filter(Boolean);
      if (categories.length > 0) {
        dbQuery = dbQuery.in('category', categories);
      }
    }

    // 검색 횟수 기반 정렬 (인기도) → 최근 검색이 많은 재료 우선
    dbQuery = dbQuery.order('search_count', { ascending: false, nullsFirst: false });

    const { data, error } = await dbQuery.limit(limit);

    if (error) {
      console.error('Error fetching ingredient suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      );
    }

    // 검색된 재료를 응답 형식으로 변환
    const suggestions = (data || []).map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name_ko || ingredient.name,
      name_en: ingredient.name_en,
      category: ingredient.category,
      image_url: ingredient.image_url,
      common_units: ingredient.common_units || [],
      emoji: ingredient.emoji || null
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
