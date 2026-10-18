import { verifyAdminAndLog } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 2026-10-04 AG2-05: recipes UPDATE RLS 는 "본인 레시피만"(auth.uid() = author_id) — 관리자 쿠키 클라이언트로
// 타인 레시피를 공개/비공개하면 0행·error 없음인데 성공 응답이었다(모더레이션 무음 실패).
// verifyAdminAndLog 통과 후에만 service-role 로 갱신(admin/users/[id] DELETE 와 같은 패턴)하고,
// 갱신된 행이 없으면(없는 id) 404 로 표면화. 본인(관리자) 레시피는 결과 동일.
async function setRecipeStatus(id: string, status: 'published' | 'private') {
  return createAdminClient().from('recipes').update({ status }).eq('id', id).select('id')
}

const RECIPE_NOT_FOUND = { error: '레시피를 찾을 수 없습니다' }

// 2026-10-04 AG2-35: publish/unpublish 블록 2벌(차이 = 감사로그 액션명·status·성공 문구) → 표 + 블록 1개(응답 동일).
const STATUS_ACTIONS = {
  publish: { log: 'publish_recipe', status: 'published', message: '레시피가 공개되었습니다' },
  unpublish: { log: 'unpublish_recipe', status: 'private', message: '레시피가 비공개 처리되었습니다' },
} as const

// PATCH /api/admin/recipes/[id] - 레시피 공개/비공개 전환
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문은 500 이었다 → action 없음 → 아래 기존 400('유효하지 않은 작업입니다').
  const body = (await request.json().catch(() => null)) ?? {}
  const { action } = body

  // action 은 정확히 'publish'·'unpublish' 일 때만 표에서 꺼낸다(임의 키로 프로토타입 속성 조회 방지)
  const statusAction =
    action === 'publish' ? STATUS_ACTIONS.publish : action === 'unpublish' ? STATUS_ACTIONS.unpublish : null
  if (statusAction) {
    const auth = await verifyAdminAndLog(statusAction.log, 'recipe', id, {}, request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: updated, error } = await setRecipeStatus(id, statusAction.status)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!updated || updated.length === 0) {
      return NextResponse.json(RECIPE_NOT_FOUND, { status: 404 })
    }

    return NextResponse.json({ success: true, message: statusAction.message })
  }

  return NextResponse.json({ error: '유효하지 않은 작업입니다' }, { status: 400 })
}

// DELETE /api/admin/recipes/[id] - 레시피 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auth = await verifyAdminAndLog('delete_recipe', 'recipe', id, {}, request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // 2026-10-19 (감사 결정 목록 #15): 관리자 쿠키 클라이언트는 RLS("본인 레시피만 DELETE")에 막혀 타인 레시피 삭제가
  // 0행 무음 성공이었다 → 관리자 확인 후 service-role, 삭제 0행(없는 id)이면 404.
  const { data: deleted, error } = await createAdminClient()
    .from('recipes')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: '레시피를 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: '레시피가 삭제되었습니다' })
}
