import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/api/clientIp'

// POST /api/recipes/[id]/view - 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  try {
    // 조회수 dedup (2026-10-19 감사 API1-25) — 예전엔 같은 요청을 반복하면 무제한 증가해 트렌딩·조회수순 정렬을
    // 조작할 수 있었다. 팁 상세와 같은 1시간 쿠키 + IP·레시피별 rate limit(쿠키를 안 보내는 스크립트 대비).
    const viewedCookie = `recipe_v_${recipeId}`
    const alreadyViewed = (request.headers.get('cookie') || '')
      .split(';')
      .some(c => c.trim().startsWith(`${viewedCookie}=`))
    if (alreadyViewed) return NextResponse.json({ success: true, deduped: true })
    const ip = getClientIp(request.headers)
    const { allowed } = await checkRateLimit(`recipe-view:${ip}:${recipeId}`, { windowMs: 60 * 60 * 1000, maxRequests: 1 })
    if (!allowed) return NextResponse.json({ success: true, deduped: true })

    // 현재 사용자 정보 (선택적)
    const { data: { user } } = await supabase.auth.getUser()

    // 2026-10-04 API1-45: 조회 기록 insert(결과 미사용)와 조회수 증가 RPC 는 서로 독립 → 병렬.
    const [{ error: viewInsertError }, { data: newCount, error: incrementError }] = await Promise.all([
      // recipe_views 테이블에 조회 기록 추가
      supabase
        .from('recipe_views')
        .insert({
          recipe_id: recipeId,
          user_id: user?.id || null,
          created_at: new Date().toISOString()
        }),
      // Database Function을 사용하여 조회수 증가 (RLS 우회)
      supabase.rpc('increment_recipe_views', { recipe_id: recipeId }),
    ])

    // 조회 기록 insert 실패는 조회수와 별개 — 로그로만 표면화(API1-25)
    if (viewInsertError) console.error('[recipes/view] recipe_views insert failed:', viewInsertError)

    if (incrementError) {
      return NextResponse.json({ success: false, error: incrementError.message }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, newCount })
    // 경로 한정 — 다른 요청에 쿠키가 실리지 않게(팁과 같은 방식)
    response.cookies.set(viewedCookie, '1', { maxAge: 60 * 60, httpOnly: true, sameSite: 'lax', path: `/api/recipes/${recipeId}` })
    return response
  } catch (error) {
    console.error('View tracking error:', error)
    // 조회수 증가 실패는 사용자 경험에 영향을 주지 않도록 200 반환
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
