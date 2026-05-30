import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/supabase/admin'

/**
 * V2 어드민 매칭 관계 관리 API (2026-05-29).
 *
 * GET — 누적 후보(작성자가 적은 substitutes 쌍) + 이미 승급된 ingredient_relations 행 반환.
 *   - 작성자 substitutes 는 *이름 문자열* 이고 V2 매칭은 *ingredient_id* 기반이라
 *     어드민이 승급 시점에 이름 → id 매핑 확인. 양쪽 다 ingredients_master 에 있어야 매칭 가능.
 *
 * POST — 어드민이 kind 선택 후 ingredient_relations INSERT.
 *   - body: { from_id, to_id, kind: 'substitute' | 'preparable_to', notes? }
 *   - kind='substitute' 면 DB trigger 로 reverse row 자동 생성.
 *
 * DELETE — 매칭 관계 제거.
 *   - query: ?from=<id>&to=<id>&kind=<substitute|preparable_to>
 *   - kind='substitute' 면 reverse row 도 함께 제거.
 */

type Kind = 'substitute' | 'preparable_to'

interface SuggestionRow {
  from_name: string
  to_name: string
  from_id: string | null   // ingredients_master 에서 매칭된 id (없으면 null)
  to_id: string | null
  count: number
  status: 'new' | 'promoted'
}

interface PromotedRow {
  from_id: string
  to_id: string
  from_name: string
  to_name: string
  kind: Kind
  source: string
  suggestion_count: number
  approved_at: string
}

export async function GET(_request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // 1) recipe_ingredients.substitutes 에서 누적 후보 쌍 카운트
  const { data: rawRows, error } = await auth.supabase
    .from('recipe_ingredients')
    .select('ingredient_name, substitutes')
    .not('substitutes', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pairCounts = new Map<string, number>()
  for (const row of rawRows ?? []) {
    const subs = Array.isArray(row.substitutes) ? (row.substitutes as unknown[]) : []
    const from = row.ingredient_name.trim()
    if (!from) continue
    for (const raw of subs) {
      let to = ''
      if (typeof raw === 'string') to = raw.trim()
      else if (raw && typeof raw === 'object' && 'name' in raw) {
        const r = raw as { name?: unknown }
        to = typeof r.name === 'string' ? r.name.trim() : ''
      }
      if (!to || to === from) continue
      const key = `${from.toLowerCase()}|${to.toLowerCase()}`
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }
  }

  // 2) 이름 → id 매핑 — ingredients_master 에서 이름 lookup
  const allNames = new Set<string>()
  for (const key of pairCounts.keys()) {
    const [from, to] = key.split('|')
    allNames.add(from)
    allNames.add(to)
  }
  const nameToId = new Map<string, string>()
  if (allNames.size > 0) {
    const { data: nameRows } = await auth.supabase
      .from('ingredients_master')
      .select('id, name')
      .in('name', Array.from(allNames).map(n => n.trim()))
    for (const row of nameRows ?? []) {
      nameToId.set((row.name as string).toLowerCase().trim(), row.id as string)
    }
  }

  // 3) 이미 승급된 ingredient_relations 행
  const { data: relationsRows } = await auth.supabase
    .from('ingredient_relations')
    .select('from_id, to_id, kind, source, suggestion_count, approved_at')

  // join 으로 이름 가져오기
  const promotedIds = new Set<string>()
  for (const r of relationsRows ?? []) {
    promotedIds.add(r.from_id as string)
    promotedIds.add(r.to_id as string)
  }
  const idToName = new Map<string, string>()
  if (promotedIds.size > 0) {
    const { data: idNameRows } = await auth.supabase
      .from('ingredients_master')
      .select('id, name')
      .in('id', Array.from(promotedIds))
    for (const row of idNameRows ?? []) {
      idToName.set(row.id as string, row.name as string)
    }
  }

  const promoted: PromotedRow[] = (relationsRows ?? [])
    .filter(r => idToName.has(r.from_id as string) && idToName.has(r.to_id as string))
    .map(r => ({
      from_id: r.from_id as string,
      to_id: r.to_id as string,
      from_name: idToName.get(r.from_id as string) ?? '',
      to_name: idToName.get(r.to_id as string) ?? '',
      kind: r.kind as Kind,
      source: r.source as string,
      suggestion_count: r.suggestion_count as number,
      approved_at: r.approved_at as string,
    }))

  // promoted 쌍 set 으로 status 계산
  const promotedKeys = new Set(
    promoted.flatMap(p => [
      `${p.from_name.toLowerCase()}|${p.to_name.toLowerCase()}`,
      `${p.to_name.toLowerCase()}|${p.from_name.toLowerCase()}`,
    ]),
  )

  const suggestions: SuggestionRow[] = []
  for (const [key, count] of pairCounts.entries()) {
    const [from, to] = key.split('|')
    const status: SuggestionRow['status'] = promotedKeys.has(key) ? 'promoted' : 'new'
    suggestions.push({
      from_name: from,
      to_name: to,
      from_id: nameToId.get(from) ?? null,
      to_id: nameToId.get(to) ?? null,
      count,
      status,
    })
  }

  suggestions.sort((a, b) => b.count - a.count || a.from_name.localeCompare(b.from_name) || a.to_name.localeCompare(b.to_name))

  return NextResponse.json({ suggestions, promoted })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const fromId = typeof body.from_id === 'string' ? body.from_id : ''
  const toId = typeof body.to_id === 'string' ? body.to_id : ''
  const kind: Kind = body.kind === 'preparable_to' ? 'preparable_to' : 'substitute'
  const notes = typeof body.notes === 'string' ? body.notes.trim() : null
  const suggestionCount = typeof body.suggestion_count === 'number' && body.suggestion_count > 0
    ? Math.floor(body.suggestion_count) : 1
  const source = body.source === 'pattern_promoted' ? 'auto' : 'admin'
  // 대체 비율(Phase 3) — substitute 에만 의미. 0 초과 양수만, 아니면 null(1:1).
  const ratio = kind === 'substitute' && typeof body.ratio === 'number' && body.ratio > 0 ? body.ratio : null

  if (!fromId || !toId) {
    return NextResponse.json({ error: 'from_id, to_id required' }, { status: 400 })
  }
  if (fromId === toId) {
    return NextResponse.json({ error: 'same id not allowed' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('ingredient_relations')
    .insert({
      from_id: fromId,
      to_id: toId,
      kind,
      source,
      suggestion_count: suggestionCount,
      notes,
      ratio,
      approved_by: auth.user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already approved' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(auth.user.id, 'relation_approve', 'ingredient_relations', data.id, {
    from_id: fromId, to_id: toId, kind, source,
  })

  return NextResponse.json({ ok: true, row: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const fromId = (searchParams.get('from') ?? '').trim()
  const toId = (searchParams.get('to') ?? '').trim()
  const kindParam = searchParams.get('kind') ?? 'substitute'
  const kind: Kind = kindParam === 'preparable_to' ? 'preparable_to' : 'substitute'

  if (!fromId || !toId) {
    return NextResponse.json({ error: 'from, to required' }, { status: 400 })
  }

  // 단방향 row 삭제. substitute 면 reverse 도 함께.
  await auth.supabase
    .from('ingredient_relations')
    .delete()
    .eq('from_id', fromId)
    .eq('to_id', toId)
    .eq('kind', kind)

  if (kind === 'substitute') {
    await auth.supabase
      .from('ingredient_relations')
      .delete()
      .eq('from_id', toId)
      .eq('to_id', fromId)
      .eq('kind', 'substitute')
  }

  await logAdminAction(auth.user.id, 'relation_revoke', 'ingredient_relations', `${fromId}-${toId}`, {
    from_id: fromId, to_id: toId, kind,
  })

  return NextResponse.json({ ok: true })
}
