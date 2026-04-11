import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    // ingredients_master 테이블에서 재료 검색
    // name, name_ko, name_en 모두 검색
    let dbQuery = supabase
      .from('ingredients_master')
      .select('id, name, name_en, name_ko, category, subcategory, image_url, common_units, search_count')
      .or(`name.ilike.%${query}%,name_ko.ilike.%${query}%,name_en.ilike.%${query}%`);

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
      common_units: ingredient.common_units || []
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
