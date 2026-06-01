import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// POST /api/recipes/[id]/posts/[postId]/like — 좋아요 토글 (원자적 RPC)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data, error } = await supabase.rpc('toggle_post_like', {
    p_post_id: postId,
    p_user_id: user.id,
  })

  if (error) {
    if (error.code === 'P0002') {
      return NextResponse.json({ error: '본인 글에는 좋아요를 누를 수 없습니다.' }, { status: 400 })
    }
    if (error.code === 'P0001') {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ error: '좋아요 처리에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ liked: data === true })
}
