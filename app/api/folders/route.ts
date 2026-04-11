import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// GET /api/folders - 폴더 목록 조회
export async function GET() {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data: folders, error } = await supabase
    .from('recipe_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ folders: folders || [] })
}

// POST /api/folders - 폴더 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { folder_name, description, color, icon } = await request.json()

  if (!folder_name || typeof folder_name !== 'string' || folder_name.trim().length === 0) {
    return NextResponse.json({ error: '폴더 이름을 입력해주세요' }, { status: 400 })
  }
  if (folder_name.length > 100) {
    return NextResponse.json({ error: '폴더 이름은 100자 이내여야 합니다' }, { status: 400 })
  }
  if (description && typeof description === 'string' && description.length > 500) {
    return NextResponse.json({ error: '설명은 500자 이내여야 합니다' }, { status: 400 })
  }

  const { data: folder, error } = await supabase
    .from('recipe_folders')
    .insert({
      user_id: user.id,
      folder_name: folder_name.trim(),
      description: description || null,
      color: color || '#ff9966',
      icon: icon || null,
      is_default: false
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ folder }, { status: 201 })
}
