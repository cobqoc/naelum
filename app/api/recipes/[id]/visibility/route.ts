import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { requireRecipeOwner } from '@/lib/api/ownership';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recipeId } = await context.params;
    const { status } = await request.json();

    // status 값 검증 — 임의 문자열 저장 방지 (CHECK 제약 부재 보완)
    const ALLOWED_STATUS = ['published', 'private', 'draft'];
    if (typeof status !== 'string' || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: '잘못된 공개 설정 값입니다.' }, { status: 400 });
    }

    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 레시피 소유자 확인 (+ published_at: 첫 발행 시각 채움 판단용 — 2026-10-04 API1-28)
    // (2026-10-04 API1-36: PUT·DELETE 와 같은 블록 → lib/api/ownership, 404/403 문구 그대로)
    const owner = await requireRecipeOwner(supabase, recipeId, user.id, '레시피를 수정할 권한이 없습니다.', 'author_id, published_at');
    if (owner.response) return owner.response;
    const recipe = owner.recipe;

    // 공개 설정 업데이트
    // 2026-10-04 API1-28: published 로 바꿀 때 published_at 이 비어 있으면 채운다(POST 로 바로 발행한 레시피만
    // 값이 있고, 임시저장→발행 레시피는 NULL 로 남았다). 이미 값이 있으면(재공개) 최초 발행 시각 유지.
    const updates: { status: string; published_at?: string } = { status };
    if (status === 'published' && !recipe.published_at) {
      updates.published_at = new Date().toISOString();
    }
    const { error: updateError } = await supabase
      .from('recipes')
      .update(updates)
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
