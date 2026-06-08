import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeSearchTerm } from '@/lib/api/sanitizeSearch';

/**
 * 검색어 확장 맵 — 사용자 의도와 DB 이름이 다른 경우 보강.
 * 예: "기름" 검색 시 "식용유"가 이름에 없어도 결과에 포함.
 * 키는 정확 일치(trim 후)일 때만 트리거.
 */
const SEARCH_EXPANSIONS: Record<string, string[]> = {
  '기름': ['식용유'],
  '오일': ['식용유', '기름'],
  // 일반명사 → 구체 제품 검색 확장 (일반명사 자체는 pending이라 검색에 안 떠도 구체 제품 노출)
  '라면': ['신라면', '진라면', '안성탕면', '짜파게티', '너구리라면', '삼양라면', '비빔면', '불닭볶음면'],
  '간장': ['진간장', '국간장', '맛간장', '어간장'],
  '액젓': ['멸치젓', '까나리액젓'],
  '치즈': ['모짜렐라치즈', '체다치즈', '슬라이스치즈', '피자치즈', '크림치즈', '파르메산치즈'],
  // 계란·노른자·흰자 검색 시 달걀 자동 노출 (모달엔 달걀 1개만 approved)
  '계란': ['달걀'],
  '노른자': ['달걀'],
  '흰자': ['달걀'],
  // "통조림 햄"은 일반명사 — 검색 시 구체 제품 노출
  '통조림 햄': ['스팸', '리챔', '로스팜', '앙코르햄'],
};

// GET /api/ingredients/autocomplete - 재료 자동완성
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const rawQuery = searchParams.get('q') || '';
  // PostgREST 필터 주입 방어(H7) — 보간 전 정규화
  const query = sanitizeSearchTerm(rawQuery);
  const limit = parseInt(searchParams.get('limit') || '10');
  const categoriesParam = searchParams.get('categories'); // 카테고리 필터 파라미터

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // 검색어 확장: 정확 일치 시 추가 검색어 포함 (expansions 는 하드코딩 상수라 안전)
    const expansions = SEARCH_EXPANSIONS[query] || [];
    const searchTerms = [query, ...expansions];
    // V2 (2026-05-29): aliases 컬럼도 검색에 포함 — "달걀" 검색 → 계란 row 매칭.
    // PostgREST `cs` (contains) 는 ARRAY 정확 매칭 — 사용자가 alias 단어 전체 입력 시 작동.
    const orConditions = searchTerms.flatMap(term => [
      `name.ilike.%${term}%`,
      `name_ko.ilike.%${term}%`,
      `name_en.ilike.%${term}%`,
      `aliases.cs.{${term}}`,
    ]).join(',');

    // ingredients_master 테이블에서 재료 검색 (status='approved' 만 — pending 노출 방지 H8)
    let dbQuery = supabase
      .from('ingredients_master')
      .select('id, name, name_en, name_ko, category, subcategory, image_url, common_units, search_count, emoji')
      .eq('status', 'approved')
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

    // 병목: 재료 자동완성은 사용자 무관·정적·쿼리별 다양 → CDN 캐시(URL 키, 입력 hot path).
    return NextResponse.json(
      { suggestions },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
