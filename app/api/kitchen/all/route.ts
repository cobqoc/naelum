import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 부엌 도감 — 가나다순 전체 보기 데이터 (V2, 2026-05-29).
 *
 * approved 재료 전체 fetch. 클라이언트에서 한글 초성 그룹화·정렬.
 * page size 제한 없음 — 현재 100개 미만이라 한 번에 가능. 향후 1000개+ 누적
 * 시 페이지네이션 검토.
 */

interface Item {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ingredients_master')
    .select('id, name, category, emoji')
    .eq('status', 'approved')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: Item[] = (data ?? []).map(row => ({
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string | null) ?? 'other',
    emoji: (row.emoji as string | null) ?? null,
  }));

  return NextResponse.json({ items, total: items.length });
}
