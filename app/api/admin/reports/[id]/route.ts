import { verifyAdminAndLog } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PATCH /api/admin/reports/[id]
 * 신고 처리 (상태 변경, 조치 기록)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status, action_taken, resolution_note } = body

    // 관리자 권한 확인 및 로그 기록
    const auth = await verifyAdminAndLog(
      'resolve_report',
      'report',
      id,
      { status, action_taken, resolution_note },
      request
    )

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status }
      )
    }

    // 신고 업데이트
    // 2026-10-04 AG2-17: reports 에는 UPDATE RLS 정책이 없어(05-31 dev pg_policies 실측) 관리자 쿠키 클라이언트의
    // update 가 0행·error 없음으로 무시되는데도 "처리되었습니다" 200 이었다 → 관리자 확인 통과 후 service-role 로
    // 갱신(admin/users/[id] DELETE 와 같은 패턴), 갱신 0행(없는 id)이면 404 로 표면화.
    const { data: updated, error } = await createAdminClient()
      .from('reports')
      .update({
        status,
        action_taken,
        resolution_note,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id')

    if (error) {
      console.error('Failed to update report:', error)
      return NextResponse.json(
        { error: '신고 처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '신고가 처리되었습니다'
    })
  } catch (error) {
    console.error('Report update error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
