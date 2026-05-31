import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetchAll';
import { NextResponse } from 'next/server';

/**
 * 부엌 도감 — 가나다순 전체 보기 데이터 (V2, 2026-05-29).
 *
 * approved 재료 전체 fetch. 클라이언트에서 한글 초성 그룹화·정렬.
 * fetchAllRows 로 .range() 페이지네이션 — 1000개 초과해도 silent 절단 없음(AUDIT H 잠복).
 */

interface Item {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
}

type Row = { id: string; name: string; category: string | null; emoji: string | null };

export async function GET() {
  const supabase = await createClient();

  let data: Row[];
  try {
    data = await fetchAllRows<Row>(() => supabase
      .from('ingredients_master')
      .select('id, name, category, emoji')
      .eq('status', 'approved')
      .order('name', { ascending: true }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const items: Item[] = data.map(row => ({
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string | null) ?? 'other',
    emoji: (row.emoji as string | null) ?? null,
  }));

  return NextResponse.json({ items, total: items.length });
}
