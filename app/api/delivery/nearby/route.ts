import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * 지도 — 현재 보이는 영역(bbox)의 식당·푸드트럭 조회.
 *
 * 설계:
 * - 좌표 검색은 20260516_delivery_schema.sql 결정 계승 — PostGIS 미사용,
 *   delivery_restaurants_geo_idx (lat,lng) btree 로 bbox 범위 조회.
 * - RLS("anyone can read active restaurants")가 is_active 강제. 명시 필터도 둠.
 * - 푸드트럭의 실시간 위치 핀(delivery_truck_locations.status='live')은 Phase 1 UI에서
 *   별도 오버레이. 이 엔드포인트는 식당/트럭의 "거점 좌표" 기준.
 *
 * 검증:
 * - bbox 4값 유한수 + 위경도 범위 + west<east, south<north
 * - bbox 면적 상한(±5°) — 전국 풀스캔 방지
 */

const MAX_SPAN_DEG = 5     // bbox 한 변 최대 5° (~450km) — DB 보호
const MAX_ROWS = 500       // 응답 행 상한

type PlaceType = 'restaurant' | 'food_truck'

interface DbRow {
  id: string
  name: string
  description: string | null
  place_type: string
  cuisine_types: string[]
  address: string | null
  lat: number | string
  lng: number | string
  rating: number | string
  rating_count: number
  is_open: boolean
  thumbnail_url: string | null
}

function num(v: string | null): number | null {
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  // 지도 패닝은 요청이 잦음(moveend마다). 비로그인 공개 조회라 IP 기준 120/분.
  const { allowed } = await checkRateLimit(`delivery_nearby:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 120,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  const sp = request.nextUrl.searchParams
  const west = num(sp.get('west'))
  const south = num(sp.get('south'))
  const east = num(sp.get('east'))
  const north = num(sp.get('north'))

  if (west === null || south === null || east === null || north === null) {
    return NextResponse.json({ error: 'bbox required (west,south,east,north)' }, { status: 400 })
  }
  if (
    west < -180 || east > 180 || south < -90 || north > 90 ||
    west >= east || south >= north
  ) {
    return NextResponse.json({ error: 'invalid bbox' }, { status: 400 })
  }
  if (east - west > MAX_SPAN_DEG || north - south > MAX_SPAN_DEG) {
    return NextResponse.json({ error: 'bbox too large' }, { status: 400 })
  }

  const typeParam = sp.get('type')
  const placeType: PlaceType | null =
    typeParam === 'restaurant' || typeParam === 'food_truck' ? typeParam : null
  const openOnly = sp.get('open') === '1'

  const supabase = await createClient()
  let query = supabase
    .from('delivery_restaurants')
    .select('id,name,description,place_type,cuisine_types,address,lat,lng,rating,rating_count,is_open,thumbnail_url')
    .eq('is_active', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', south)
    .lte('lat', north)
    .gte('lng', west)
    .lte('lng', east)
    .limit(MAX_ROWS)

  if (placeType) query = query.eq('place_type', placeType)
  if (openOnly) query = query.eq('is_open', true)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'query failed' }, { status: 500 })
  }

  const places = (data as DbRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    placeType: (r.place_type === 'food_truck' ? 'food_truck' : 'restaurant') as PlaceType,
    cuisineTypes: r.cuisine_types ?? [],
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    rating: Number(r.rating),
    ratingCount: r.rating_count,
    isOpen: r.is_open,
    thumbnailUrl: r.thumbnail_url,
  }))

  return NextResponse.json(
    { places },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  )
}
