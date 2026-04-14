import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { notifySave } from '@/lib/notifications/create'
import { sanitizeHtml } from '@/lib/security/sanitize'

// POST /api/recipes/[id]/save - 저장 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  let body: { folder_id?: string; notes?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }
  const folderId = body.folder_id || null
  const rawNotes = body.notes ?? null
  const notes = typeof rawNotes === 'string' ? sanitizeHtml(rawNotes) : null

  // 기존 저장 확인
  const { data: existingSave } = await supabase
    .from('recipe_saves')
    .select('id')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingSave) {
    // 저장 취소
    await supabase
      .from('recipe_saves')
      .delete()
      .eq('id', existingSave.id)

    await supabase.rpc('decrement_saves_count', { recipe_id: recipeId })

    return NextResponse.json({ saved: false })
  } else {
    // 저장 추가
    await supabase
      .from('recipe_saves')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        folder_id: folderId,
        notes,
      })

    await supabase.rpc('increment_saves_count', { recipe_id: recipeId })

    // 알림 생성
    const { data: recipe } = await supabase
      .from('recipes')
      .select('author_id, title')
      .eq('id', recipeId)
      .maybeSingle()

    if (recipe && recipe.author_id !== user.id) {
      const { data: saver } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      await notifySave(
        supabase,
        recipe.author_id,
        saver?.username || '누군가',
        recipeId,
        recipe.title,
        user.id,
      )
    }

    return NextResponse.json({ saved: true })
  }
}

// PUT /api/recipes/[id]/save - 메모 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const body = await request.json()
  const rawNotes = body.notes ?? null
  const notes = typeof rawNotes === 'string' ? sanitizeHtml(rawNotes) : null

  const { data, error } = await supabase
    .from('recipe_saves')
    .update({ notes })
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .select('id, notes')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '저장된 레시피를 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ notes: data.notes })
}

// GET /api/recipes/[id]/save - 저장 상태 및 메모 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data } = await supabase
    .from('recipe_saves')
    .select('id, notes')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    saved: !!data,
    notes: data?.notes || null,
  })
}
