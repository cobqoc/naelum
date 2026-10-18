import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// GET /api/search/history - 검색 히스토리 조회
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ history: [] })
  }

  const { data: history } = await supabase
    .from('search_history')
    .select('id, search_query, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // 중복 제거 — 같은 검색어는 *가장 최근* 행(id·created_at)을 남긴다. 예전 Map 은 값이 마지막(=가장 오래된) 행으로
  // 덮여, 그 id 로 지우면 더 최근 중복이 남아 검색어가 다시 나타났다. 또 limit(10) 을 중복 제거 전에 걸어
  // 같은 검색어를 연달아 하면 목록이 줄었다 → 넉넉히 받아 고유 10개 (2026-10-19 감사 API1-07).
  const seen = new Set<string>()
  const uniqueHistory = (history ?? [])
    .filter(item => !seen.has(item.search_query) && !!seen.add(item.search_query))
    .slice(0, 10)

  return NextResponse.json({ history: uniqueHistory })
}

// DELETE /api/search/history - 검색 히스토리 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    // 특정 항목 삭제 — 목록은 검색어 단위라, 그 id 의 검색어 기록을 전부 지운다(KMP 계약 ?id= 는 그대로, API1-07).
    // 예전엔 그 행만 지워 같은 검색어의 다른 기록이 다시 목록에 올라왔다.
    const { data: row, error: readErr } = await supabase
      .from('search_history')
      .select('search_query')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
    if (row) {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('search_query', row.search_query)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // 전체 삭제
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
