import { verifyAdminAndLog } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin/recipes/[id] - 레시피 공개/비공개 전환
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { action } = body

  if (action === 'publish') {
    const auth = await verifyAdminAndLog('publish_recipe', 'recipe', id, {}, request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { error } = await auth.supabase
      .from('recipes')
      .update({ is_published: true })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '레시피가 공개되었습니다' })
  }

  if (action === 'unpublish') {
    const auth = await verifyAdminAndLog('unpublish_recipe', 'recipe', id, {}, request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { error } = await auth.supabase
      .from('recipes')
      .update({ is_published: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '레시피가 비공개 처리되었습니다' })
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

  const { error } = await auth.supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: '레시피가 삭제되었습니다' })
}
