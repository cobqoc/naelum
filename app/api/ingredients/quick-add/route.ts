import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * V2 빠른 추가 재료 API (2026-05-29).
 *
 * 개인화 + 글로벌 인기도 폴백 — 코드 상수 quickAddList 대체.
 *
 * 응답 우선순위:
 *   1. 본인 user_ingredients 카테고리별 추가 빈도 (개인화)
 *   2. 전체 사용자 인기도 (글로벌 폴백)
 *
 * Query:
 *   - category: 'veggie' | 'meat' | 'seafood' | 'dairy' | 'egg' | 'seasoning' | 'spice' | 'grain' | 'legume' | 'fermented' | 'condiment' | 'beverage' | 'snack' | 'bakery' | 'processed' | 'other' | 'all'
 *   - limit: 기본 12
 */

interface QuickAddItem {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
  storage?: '냉장' | '냉동' | '상온';
  add_count: number;
  source: 'personal' | 'global';
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? 'all';
  const rawLimit = parseInt(searchParams.get('limit') ?? '12', 10);
  const limit = Math.min(Math.max(1, Number.isNaN(rawLimit) ? 12 : rawLimit), 40);

  const { data: { user } } = await supabase.auth.getUser();

  // 카테고리 필터 — 'all' 이면 전체
  const inCategory = (q: ReturnType<typeof supabase.from> extends infer T ? T : never) => q;
  void inCategory;

  const items: QuickAddItem[] = [];
  const seenIds = new Set<string>();

  // 1) 개인화 — 본인 user_ingredients 카테고리별 추가 빈도
  if (user) {
    const personalQuery = supabase
      .from('user_ingredients')
      .select('ingredient_id, ingredient_name, ingredient_category')
      .eq('user_id', user.id)
      .not('ingredient_id', 'is', null);
    if (category !== 'all') personalQuery.eq('ingredient_category', category);
    const { data: userRows } = await personalQuery;

    // ingredient_id 별 카운트
    const personalCounts = new Map<string, number>();
    for (const row of userRows ?? []) {
      const id = row.ingredient_id as string;
      personalCounts.set(id, (personalCounts.get(id) ?? 0) + 1);
    }

    const personalIds = Array.from(personalCounts.keys());
    if (personalIds.length > 0) {
      const { data: masterRows } = await supabase
        .from('ingredients_master')
        .select('id, name, category, emoji')
        .in('id', personalIds)
        .eq('status', 'approved');
      for (const m of masterRows ?? []) {
        if (seenIds.has(m.id as string)) continue;
        items.push({
          id: m.id as string,
          name: m.name as string,
          category: m.category as string,
          emoji: (m.emoji as string | null) ?? null,
          add_count: personalCounts.get(m.id as string) ?? 0,
          source: 'personal',
        });
        seenIds.add(m.id as string);
      }
      items.sort((a, b) => b.add_count - a.add_count || a.name.localeCompare(b.name));
    }
  }

  // 2) 글로벌 폴백 — 부족하면 전체 사용자 인기도로 보충
  if (items.length < limit) {
    // 전체 사용자 user_ingredients 집계 — ingredient_id 별 row 수
    const globalQuery = supabase
      .from('user_ingredients')
      .select('ingredient_id', { count: 'exact', head: false })
      .not('ingredient_id', 'is', null);
    const { data: globalRows } = await globalQuery;

    const globalCounts = new Map<string, number>();
    for (const row of globalRows ?? []) {
      const id = (row as { ingredient_id: string }).ingredient_id;
      if (seenIds.has(id)) continue;
      globalCounts.set(id, (globalCounts.get(id) ?? 0) + 1);
    }

    // 카운트 내림차순 정렬
    const sortedGlobalIds = Array.from(globalCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit - items.length + 20); // 여유분

    if (sortedGlobalIds.length > 0) {
      const globalMasterQuery = supabase
        .from('ingredients_master')
        .select('id, name, category, emoji')
        .in('id', sortedGlobalIds)
        .eq('status', 'approved');
      if (category !== 'all') globalMasterQuery.eq('category', category);
      const { data: masterRows } = await globalMasterQuery;

      const globalItems: QuickAddItem[] = [];
      for (const m of masterRows ?? []) {
        if (seenIds.has(m.id as string)) continue;
        globalItems.push({
          id: m.id as string,
          name: m.name as string,
          category: m.category as string,
          emoji: (m.emoji as string | null) ?? null,
          add_count: globalCounts.get(m.id as string) ?? 0,
          source: 'global',
        });
        seenIds.add(m.id as string);
      }
      globalItems.sort((a, b) => b.add_count - a.add_count || a.name.localeCompare(b.name));
      items.push(...globalItems);
    }
  }

  // 3) 그래도 부족하면 approved 마스터에서 카테고리별 기본 채움 (콜드 스타트 폴백)
  if (items.length < limit) {
    const fallbackQuery = supabase
      .from('ingredients_master')
      .select('id, name, category, emoji')
      .eq('status', 'approved')
      .order('search_count', { ascending: false })
      .limit(limit - items.length + 10);
    if (category !== 'all') fallbackQuery.eq('category', category);
    const { data: fallbackRows } = await fallbackQuery;

    for (const m of fallbackRows ?? []) {
      if (seenIds.has(m.id as string)) continue;
      items.push({
        id: m.id as string,
        name: m.name as string,
        category: m.category as string,
        emoji: (m.emoji as string | null) ?? null,
        add_count: 0,
        source: 'global',
      });
      seenIds.add(m.id as string);
    }
  }

  return NextResponse.json({
    items: items.slice(0, limit),
    total: items.length,
  });
}
