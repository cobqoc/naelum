import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 부엌 도감 메인 — 카테고리별 카운트 + 미리보기 (V2, 2026-05-29).
 *
 * 한 번의 호출로 모든 카테고리 정보 반환:
 *   - count: approved 재료 수
 *   - preview: 카테고리별 상위 8개 (이모지 있는 거 우선 + search_count 순)
 *
 * 카드 그리드 메인 페이지(/kitchen) 에서 사용.
 */

interface PreviewItem {
  id: string;
  name: string;
  emoji: string | null;
}

interface CategorySummary {
  category: string;
  count: number;
  preview: PreviewItem[];
}

const PREVIEW_LIMIT = 8;

export async function GET() {
  const supabase = await createClient();

  // 1) 모든 approved 재료 + 카운트
  const { data: rows, error } = await supabase
    .from('ingredients_master')
    .select('id, name, category, emoji, search_count')
    .eq('status', 'approved');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2) 카테고리별 그룹화 + 정렬
  const byCategory = new Map<string, Array<{ id: string; name: string; emoji: string | null; search_count: number | null }>>();
  for (const row of rows ?? []) {
    const cat = (row.category as string | null) ?? 'other';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push({
      id: row.id as string,
      name: row.name as string,
      emoji: (row.emoji as string | null) ?? null,
      search_count: (row.search_count as number | null) ?? null,
    });
  }

  // 3) 카테고리별 카운트 + 미리보기 (이모지 있는 거 우선, 그 안에서 search_count 내림차순)
  const ingredient_categories: CategorySummary[] = Array.from(byCategory.entries())
    .map(([category, items]) => {
      const sorted = items.sort((a, b) => {
        const aHasEmoji = a.emoji ? 1 : 0;
        const bHasEmoji = b.emoji ? 1 : 0;
        if (aHasEmoji !== bHasEmoji) return bHasEmoji - aHasEmoji;
        const aSc = a.search_count ?? 0;
        const bSc = b.search_count ?? 0;
        if (aSc !== bSc) return bSc - aSc;
        return a.name.localeCompare(b.name);
      });
      return {
        category,
        count: items.length,
        preview: sorted.slice(0, PREVIEW_LIMIT).map(i => ({
          id: i.id,
          name: i.name,
          emoji: i.emoji,
        })),
      };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ ingredient_categories });
}
