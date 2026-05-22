import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/recipes/bulk - 레시피 일괄 공개/비공개/삭제 (관리자용)
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const ids: unknown = body?.ids
  const action: unknown = body?.action

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
    return NextResponse.json({ error: '레시피를 선택해주세요' }, { status: 400 })
  }
  if (ids.length > 200) {
    return NextResponse.json({ error: '한 번에 최대 200개까지 처리할 수 있습니다' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish' && action !== 'delete') {
    return NextResponse.json({ error: '유효하지 않은 작업입니다' }, { status: 400 })
  }

  const idList = ids as string[]

  if (action === 'delete') {
    const { error } = await auth.supabase.from('recipes').delete().in('id', idList)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, count: idList.length })
  }

  // publish → 공개, unpublish → 비공개(private). 단건 PATCH 와 동일 의미.
  const status = action === 'publish' ? 'published' : 'private'
  const { error } = await auth.supabase.from('recipes').update({ status }).in('id', idList)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: idList.length })
}
