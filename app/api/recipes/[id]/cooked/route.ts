import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// GET /api/recipes/[id]/cooked - 현재 사용자의 요리 완료 여부 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data } = await supabase
    .from('cooking_sessions')
    .select('id')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .maybeSingle()

  return NextResponse.json({ hasCooked: !!data })
}

// DELETE /api/recipes/[id]/cooked - 만들어본 음식 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  try {
    // 해당 사용자의 cooking session 삭제
    const { error } = await supabase
      .from('cooking_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .not('completed_at', 'is', null)

    if (error) {
      console.error('Error deleting cooking session:', error)
      return NextResponse.json({ error: '삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '만들어본 음식 기록이 삭제되었습니다'
    })
  } catch (error) {
    console.error('Delete cooked recipe error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
