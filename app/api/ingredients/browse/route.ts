import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parsePagination } from '@/lib/api/pagination';

/**
 * GET /api/ingredients/browse
 * 재료 모달용 페이지네이션 API
 * 인기순으로 정렬된 재료 목록을 반환
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // 파라미터 파싱
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 50 });
  const query = searchParams.get('q') || '';
  const categoriesParam = searchParams.get('categories') || '';
  const sort = searchParams.get('sort') || 'search_count'; // search_count | name
  const taste = searchParams.get('taste') || ''; // sweet | salty | spicy | sour | bitter | umami

  try {
    // 기본 쿼리 (approved된 재료만)
    let dbQuery = supabase
      .from('ingredients_master')
      .select('id, name, name_en, name_ko, category, subcategory, image_url, common_units, search_count, tastes, countries_used, storage_tips, seasons, nutrition, pairs_well_with, description, nutrition_detail')
      .eq('status', 'approved'); // 승인된 재료만

    // 검색어 필터
    if (query.trim() && query.length >= 2) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,name_ko.ilike.%${query}%,name_en.ilike.%${query}%`);
    }

    // 카테고리 필터
    if (categoriesParam) {
      const categories = categoriesParam.split(',').filter(Boolean);
      if (categories.length > 0) {
        dbQuery = dbQuery.in('category', categories);
      }
    }

    // 맛 필터
    const VALID_TASTES = ['sweet', 'salty', 'spicy', 'sour', 'bitter', 'umami'];
    if (taste && VALID_TASTES.includes(taste)) {
      dbQuery = dbQuery.gt(`tastes->>${taste}`, '0');
    }

    // 정렬
    if (sort === 'search_count') {
      dbQuery = dbQuery.order('search_count', { ascending: false, nullsFirst: false });
    } else if (sort === 'name') {
      dbQuery = dbQuery.order('name', { ascending: true });
    }

    // 페이지네이션
    dbQuery = dbQuery.range(offset, rangeEnd);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error fetching ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    const ingredients = (data || []).map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name_ko || ingredient.name,
      name_en: ingredient.name_en,
      category: ingredient.category,
      subcategory: ingredient.subcategory,
      image_url: ingredient.image_url,
      common_units: ingredient.common_units || [],
      search_count: ingredient.search_count || 0,
      tastes: ingredient.tastes || null,
      countries_used: ingredient.countries_used || null,
      storage_tips: ingredient.storage_tips || null,
      seasons: ingredient.seasons || null,
      nutrition: ingredient.nutrition || null,
      pairs_well_with: ingredient.pairs_well_with || null,
      description: ingredient.description || null,
      nutrition_detail: ingredient.nutrition_detail || null,
      // AutocompleteItem 필드
      label: ingredient.name_ko || ingredient.name,
      secondaryLabel: ingredient.name_en || undefined,
      badge: ingredient.category || undefined,
    }));

    return NextResponse.json({
      ingredients,
      page,
      limit,
      hasMore: ingredients.length === limit,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
