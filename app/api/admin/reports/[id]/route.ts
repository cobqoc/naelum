import { verifyAdminAndLog } from '@/lib/supabase/admin'
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
    const { error } = await auth.supabase
      .from('reports')
      .update({
        status,
        action_taken,
        resolution_note,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to update report:', error)
      return NextResponse.json(
        { error: '신고 처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
        { status: 500 }
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
