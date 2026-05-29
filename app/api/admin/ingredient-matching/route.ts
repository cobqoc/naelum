import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * 어드민 "재료 매칭 — 번호 연결" API (2026-05-29).
 *
 * V2 매칭은 recipe_ingredients.ingredient_id 기반인데, 현재 미연결(NULL) 행이 대량.
 * 자동 부여 대신 *어드민 승인*으로 번호를 붙인다 (추측 0 — 정직성 정책).
 *
 *  GET            — 미연결 재료 목록(빈도순) + 이름 정확일치 제안 + 요약 카운트
 *  GET ?q=<term>  — 마스터 검색 ("다른 재료로 연결/별칭" 시)
 *  POST           — 승인 액션:
 *    - action='link'        { ingredient_name, ingredient_id }  → 그 이름의 미연결 행 전부에 번호 부여
 *    - action='alias_link'  { ingredient_name, target_id }      → 대상 마스터 aliases 에 이름 추가 + 연결
 *    - action='create_link' { ingredient_name, category }       → 새 마스터(approved) 생성 + 연결
 *
 * 쓰기는 service-role (어드민은 레시피 소유자가 아니라 recipe_ingredients RLS 가 막음 — CLAUDE.md).
 * 관계(쌀→밥 등)는 별개 — /api/admin/substitute-suggestions 담당.
 */

// 생성된 Database 타입의 deep instantiation + 신규 RPC 미포함 회피 — 서버 전용 어드민 루트라 loose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

interface UnresolvedRow {
  ingredient_name: string
  row_count: number
  suggested_id: string | null
  suggested_category: string | null
  match_count: number
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const service: AnyClient = createServiceClient()

  // 검색 모드 — 어드민이 연결/별칭 대상 마스터를 찾을 때
  if (q) {
    const { data, error } = await service
      .from('ingredients_master')
      .select('id, name, category, emoji')
      .eq('status', 'approved')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ results: data ?? [] })
  }

  // 목록 모드 — 미연결 재료(빈도순)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '100', 10) || 100, 1), 300)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0)

  const [{ data: items, error: itemsErr }, { data: summary, error: sumErr }] = await Promise.all([
    service.rpc('admin_unresolved_ingredients', { p_limit: limit, p_offset: offset }),
    service.rpc('admin_unresolved_ingredients_summary'),
  ])
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  if (sumErr) return NextResponse.json({ error: sumErr.message }, { status: 500 })

  const s = Array.isArray(summary) ? summary[0] : summary
  return NextResponse.json({
    items: (items ?? []) as UnresolvedRow[],
    distinctNames: Number(s?.distinct_names ?? 0),
    totalRows: Number(s?.total_rows ?? 0),
    limit,
    offset,
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const action = typeof body.action === 'string' ? body.action : ''
  const name = typeof body.ingredient_name === 'string' ? body.ingredient_name.trim() : ''
  if (!name) return NextResponse.json({ error: 'ingredient_name required' }, { status: 400 })

  const service: AnyClient = createServiceClient()

  // 이름의 모든 미연결 행에 번호 부여 (service-role — RLS 우회)
  const linkRows = async (ingredientId: string): Promise<{ count: number; error: { message: string } | null }> => {
    const { data, error } = await service
      .from('recipe_ingredients')
      .update({ ingredient_id: ingredientId })
      .eq('ingredient_name', name)
      .is('ingredient_id', null)
      .select('id')
    return { count: data?.length ?? 0, error }
  }

  if (action === 'link') {
    const id = typeof body.ingredient_id === 'string' ? body.ingredient_id : ''
    if (!id) return NextResponse.json({ error: 'ingredient_id required' }, { status: 400 })
    const { count, error } = await linkRows(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAdminAction(auth.user.id, 'ingredient_link', 'recipe_ingredients', id, { ingredient_name: name, count })
    return NextResponse.json({ ok: true, linked: count })
  }

  if (action === 'alias_link') {
    const targetId = typeof body.target_id === 'string' ? body.target_id : ''
    if (!targetId) return NextResponse.json({ error: 'target_id required' }, { status: 400 })
    const { data: master, error: mErr } = await service
      .from('ingredients_master')
      .select('id, name, aliases')
      .eq('id', targetId)
      .single()
    if (mErr || !master) return NextResponse.json({ error: mErr?.message ?? 'target not found' }, { status: 404 })
    // 같은 이름이면 별칭 불필요 (정확일치). 다르면 대상 aliases 에 추가.
    if (master.name !== name) {
      const aliases: string[] = Array.isArray(master.aliases) ? master.aliases : []
      if (!aliases.includes(name)) {
        const { error: upErr } = await service
          .from('ingredients_master')
          .update({ aliases: [...aliases, name] })
          .eq('id', targetId)
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      }
    }
    const { count, error } = await linkRows(targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAdminAction(auth.user.id, 'ingredient_alias_link', 'ingredients_master', targetId, { ingredient_name: name, count })
    return NextResponse.json({ ok: true, linked: count })
  }

  if (action === 'create_link') {
    const category = typeof body.category === 'string' && body.category ? body.category : 'other'
    const { data: created, error: cErr } = await service
      .from('ingredients_master')
      .insert({ name, category, status: 'approved', data_source: 'admin' })
      .select('id')
      .single()
    if (cErr) {
      if (cErr.code === '23505') return NextResponse.json({ error: '이미 같은 이름의 재료가 있습니다' }, { status: 409 })
      return NextResponse.json({ error: cErr.message }, { status: 500 })
    }
    const { count, error } = await linkRows(created.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAdminAction(auth.user.id, 'ingredient_create_link', 'ingredients_master', created.id, { ingredient_name: name, category, count })
    return NextResponse.json({ ok: true, linked: count, created_id: created.id })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
