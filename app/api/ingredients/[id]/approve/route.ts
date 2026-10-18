import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/api/adminGuard';

/**
 * PATCH /api/ingredients/[id]/approve
 * 재료 승인/거부 (관리자 전용)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();

    // 1·2. 인증 + 관리자 권한 — 2026-10-04 AG2-31: checkAdminRole 2벌·이 블록 3벌 → lib/api/adminGuard.requireAdminRole
    // (401 requireAuth 본문·403 '관리자 권한이 필요합니다'·프로필 없음 403 그대로)
    const admin = await requireAdminRole(supabase);
    if (admin.response) return admin.response;
    const user = admin.user;

    // 3. 요청 데이터 파싱
    // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문은 catch → 500 'Internal server error' 였다 → action 없음 → 아래 기존 400.
    const body = (await request.json().catch(() => null)) ?? {};
    const { action } = body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    // 4. 재료 존재 확인
    const { data: ingredient } = await supabase
      .from('ingredients_master')
      .select('id, name, status')
      .eq('id', id)
      .maybeSingle();

    if (!ingredient) {
      return NextResponse.json(
        { error: '재료를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 5. 재료 상태 업데이트
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: updatedIngredient, error: updateError } = await supabase
      .from('ingredients_master')
      .update({
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ingredient:', updateError);
      return NextResponse.json(
        { error: '재료 업데이트 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ingredient: updatedIngredient,
      message: `재료가 ${action === 'approve' ? '승인' : '거부'}되었습니다`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingredients/[id]/approve
 * 재료 삭제 (관리자 전용)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();

    // 1·2. 인증 + 관리자 권한 — 2026-10-04 AG2-31: checkAdminRole 2벌·이 블록 3벌 → lib/api/adminGuard.requireAdminRole
    // (401 requireAuth 본문·403 '관리자 권한이 필요합니다'·프로필 없음 403 그대로)
    const admin = await requireAdminRole(supabase);
    if (admin.response) return admin.response;

    // 3. 재료 삭제
    const { error: deleteError } = await supabase
      .from('ingredients_master')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting ingredient:', deleteError);
      return NextResponse.json(
        { error: '재료 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '재료가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
