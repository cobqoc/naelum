import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/recipes/[id]/view - 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  try {
    // 현재 사용자 정보 (선택적)
    const { data: { user } } = await supabase.auth.getUser()

    // recipe_views 테이블에 조회 기록 추가
    await supabase
      .from('recipe_views')
      .insert({
        recipe_id: recipeId,
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      })

    // Database Function을 사용하여 조회수 증가 (RLS 우회)
    const { data: newCount, error: incrementError } = await supabase
      .rpc('increment_recipe_views', { recipe_id: recipeId })

    if (incrementError) {
      return NextResponse.json({ success: false, error: incrementError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, newCount })
  } catch (error) {
    console.error('View tracking error:', error)
    // 조회수 증가 실패는 사용자 경험에 영향을 주지 않도록 200 반환
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
