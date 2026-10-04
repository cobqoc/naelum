import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/folders/[id] - 폴더 상세 조회 (저장된 레시피 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 12 })

  // 2026-10-04 API1-45: 폴더 조회와 폴더 내 저장 레시피 조회는 서로 독립(둘 다 id·user.id 만 의존) → 병렬.
  // 폴더가 없으면 아래에서 404 — 그때 saves 결과는 버린다(응답 동일).
  const [{ data: folder, error: folderError }, { data: saves, count }] = await Promise.all([
    // 폴더 정보 — user_id 는 필터 키라 반환 불필요, 나머지 전 컬럼 명시(과대 fetch 축소)
    supabase
      .from('recipe_folders')
      .select('id, folder_name, description, color, icon, is_default, recipes_count, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    // 폴더의 레시피
    supabase
      .from('recipe_saves')
      .select(`
      id,
      notes,
      created_at,
      recipe:recipes(
        id, title, description, thumbnail_url,
        prep_time_minutes, cook_time_minutes, difficulty_level,
        average_rating,
        author:profiles!recipes_author_id_fkey(username, avatar_url)
      )
    `, { count: 'exact' })
      .eq('folder_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, rangeEnd),
  ])

  if (folderError || !folder) {
    return NextResponse.json({ error: '폴더를 찾을 수 없습니다' }, { status: 404 })
  }

  // 2026-10-04 API1-10: RLS 로 가려진(비공개 전환된) 레시피는 recipe=null 임베드라 id 없는 항목이 섞였다
  // (KMP NaelumFolderRecipeItemDto 의 id·title 필수 → 디코딩 실패) → 그런 항목만 제외, 정상 항목·순서 동일.
  const recipes = saves?.filter(s => s.recipe != null).map(s => ({ ...s.recipe, save_id: s.id, save_notes: s.notes })) || []

  return NextResponse.json({
    folder,
    recipes,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// PUT /api/folders/[id] - 폴더 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { folder_name, description, color, icon } = await request.json()

  if (folder_name !== undefined) {
    if (typeof folder_name !== 'string' || folder_name.trim().length === 0 || folder_name.length > 100) {
      return NextResponse.json({ error: '폴더 이름은 1~100자여야 합니다' }, { status: 400 })
    }
  }
  if (description !== undefined && description !== null && typeof description === 'string' && description.length > 500) {
    return NextResponse.json({ error: '설명은 500자 이내여야 합니다' }, { status: 400 })
  }
  if (color !== undefined && color !== null && (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color))) {
    return NextResponse.json({ error: '유효하지 않은 색상 형식입니다' }, { status: 400 })
  }

  const { data: folder, error } = await supabase
    .from('recipe_folders')
    .update({
      folder_name: typeof folder_name === 'string' ? folder_name.trim() : folder_name,
      description,
      color,
      icon,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ folder })
}

// DELETE /api/folders/[id] - 폴더 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  // 기본 폴더는 삭제 불가
  const { data: folder } = await supabase
    .from('recipe_folders')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (folder?.is_default) {
    return NextResponse.json({ error: '기본 폴더는 삭제할 수 없습니다' }, { status: 400 })
  }

  // 폴더 내 저장된 레시피의 folder_id를 null로 변경 (실패 시 다음 삭제가 FK 위반)
  const { error: unlinkError } = await supabase
    .from('recipe_saves')
    .update({ folder_id: null })
    .eq('folder_id', id)
  if (unlinkError) {
    return NextResponse.json({ error: unlinkError.message }, { status: 500 })
  }

  // 폴더 삭제
  const { error } = await supabase
    .from('recipe_folders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
