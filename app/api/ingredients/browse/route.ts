import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parsePagination } from '@/lib/api/pagination';
import { sanitizeSearchTerm } from '@/lib/api/sanitizeSearch';

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
  const query = sanitizeSearchTerm(searchParams.get('q') || ''); // PostgREST 필터 주입 방어(H7)
  const categoriesParam = searchParams.get('categories') || '';
  const namesParam = searchParams.get('names') || ''; // 이름 목록으로 직접 조회 (popular items 등)
  const sort = searchParams.get('sort') || 'search_count'; // search_count | name
  const taste = searchParams.get('taste') || ''; // sweet | salty | spicy | sour | bitter | umami
  const includePending = searchParams.get('includePending') === 'true'; // 요리 도감용: pending 포함

  try {
    // 기본 쿼리
    let dbQuery = supabase
      .from('ingredients_master')
      .select('id, name, name_en, name_ko, category, subcategory, image_url, common_units, search_count, tastes, countries_used, storage_tips, seasons, nutrition, pairs_well_with, description, nutrition_detail, emoji, shelf_life_days', { count: 'exact' })
      .in('status', includePending ? ['approved', 'pending'] : ['approved']);

    // 이름 목록 필터 (names 파라미터 있으면 카테고리/검색어 필터보다 우선)
    if (namesParam) {
      const names = namesParam.split(',').map(n => n.trim()).filter(Boolean);
      if (names.length > 0) {
        dbQuery = dbQuery.in('name', names);
      }
    } else {
      // 검색어 필터 — V2 (2026-05-29): aliases 컬럼도 검색에 포함.
      if (query.trim() && query.length >= 2) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,name_ko.ilike.%${query}%,name_en.ilike.%${query}%,aliases.cs.{${query}}`);
      }

      // 카테고리 필터 — 본질(essence) 기준 category 값으로 단일화 (H11).
      // 'processed'(가공식품)는 *여러 식품 조합* 본질 카테고리(햄·베이컨·소시지·스팸)이며,
      // is_processed 불리언(가공 여부 속성)과 무관. 치즈=dairy·다진육=meat·마가린=oil 은
      // 각 본질 카테고리에 그대로 노출(is_processed=true 라도). 옛 is_processed 가상필터는
      // 치즈·다진육을 가공식품 탭에 중복 노출 + 본질 탭에서 제외(picker 도달 불가)시켰음.
      if (categoriesParam) {
        const categories = categoriesParam.split(',').filter(Boolean);
        if (categories.length > 0) {
          dbQuery = dbQuery.in('category', categories);
        }
      }
    }

    // 맛 필터
    const VALID_TASTES = ['sweet', 'salty', 'spicy', 'sour', 'bitter', 'umami'];
    if (taste && VALID_TASTES.includes(taste)) {
      dbQuery = dbQuery.gt(`tastes->>${taste}`, '0');
    }

    // 정렬 — search_count 동률(0) 시 description 있는 항목 우선, 이후 이름 가나다순
    if (sort === 'search_count') {
      dbQuery = dbQuery
        .order('search_count', { ascending: false, nullsFirst: false })
        .order('description', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true });
    } else if (sort === 'name') {
      dbQuery = dbQuery.order('name', { ascending: true });
    }

    // 페이지네이션
    dbQuery = dbQuery.range(offset, rangeEnd);

    const { data, error, count } = await dbQuery;

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
      emoji: ingredient.emoji || null,
      shelf_life_days: ingredient.shelf_life_days || null,
      // AutocompleteItem 필드
      label: ingredient.name_ko || ingredient.name,
      secondaryLabel: ingredient.name_en || undefined,
      badge: ingredient.category || undefined,
    }));

    // 병목: 재료 마스터는 사용자 무관·거의 정적이고 쿼리별로 다양(파라미터) → CDN 캐시(URL 키).
    // 완전공개라 public 안전. 마스터 변동은 admin 편집뿐이라 s-maxage 5분 + SWR 허용.
    return NextResponse.json({
      ingredients,
      total: count ?? 0,
      page,
      limit,
      hasMore: ingredients.length === limit,
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
