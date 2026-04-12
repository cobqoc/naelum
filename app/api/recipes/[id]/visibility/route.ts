import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recipeId } = await context.params;
    const { status } = await request.json();

    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 레시피 소유자 확인
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', recipeId)
      .single();

    if (fetchError || !recipe) {
      return NextResponse.json(
        { error: '레시피를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (recipe.author_id !== user.id) {
      return NextResponse.json(
        { error: '레시피를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 공개 설정 업데이트
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ status })
      .eq('id', recipeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '레시피 공개 설정 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error in visibility API:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
