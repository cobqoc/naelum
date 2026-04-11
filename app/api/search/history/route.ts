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
    .limit(10)

  // 중복 제거
  const uniqueHistory = history
    ? [...new Map(history.map(item => [item.search_query, item])).values()].slice(0, 10)
    : []

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
    // 특정 항목 삭제
    await supabase
      .from('search_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
  } else {
    // 전체 삭제
    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
