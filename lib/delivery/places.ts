// 지도 도메인 어댑터 — map-core 의 RestaurantApi(mock) 자리를 낼름 Supabase 백엔드로 대체.
// /api/delivery/nearby 를 호출해 bbox 안의 식당·푸드트럭을 가져오고,
// map-core MarkerData 로 변환한다. React 비의존(컴포넌트/훅에서 자유롭게 사용).
//
// 식당 vs 푸드트럭: place_type 로 구분. 푸드트럭 실시간 위치(status='live') 오버레이는
// Phase 1 UI 에서 delivery_truck_locations 별도 조회로 합성.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoundingBox, MarkerData } from '@/components/map';

export type PlaceType = 'restaurant' | 'food_truck';

export interface DeliveryPlace {
  id: string;
  name: string;
  description: string | null;
  placeType: PlaceType;
  cuisineTypes: string[];
  address: string | null;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number;
  isOpen: boolean;
  thumbnailUrl: string | null;
}

export interface NearbyOptions {
  placeType?: PlaceType;   // 미지정 시 식당+트럭 모두
  openOnly?: boolean;      // 영업 중만
  signal?: AbortSignal;    // 지도 패닝 중 직전 요청 취소용
}

/** bbox 안의 식당·푸드트럭 조회. 실패 시 빈 배열(지도 UX는 끊기지 않게). */
export async function fetchNearbyPlaces(
  bbox: BoundingBox,
  opts: NearbyOptions = {},
): Promise<DeliveryPlace[]> {
  const params = new URLSearchParams({
    west: String(bbox.west),
    south: String(bbox.south),
    east: String(bbox.east),
    north: String(bbox.north),
  });
  if (opts.placeType) params.set('type', opts.placeType);
  if (opts.openOnly) params.set('open', '1');

  let res: Response;
  try {
    res = await fetch(`/api/delivery/nearby?${params}`, { signal: opts.signal });
  } catch {
    return []; // AbortError 포함 — 호출 측에서 다음 결과로 갱신됨
  }
  if (!res.ok) return [];

  const json = (await res.json()) as { places?: DeliveryPlace[] };
  return json.places ?? [];
}

interface LiveTruckRow {
  id: string;
  restaurant_id: string;
  lat: number | string;
  lng: number | string;
  label: string | null;
  restaurant: {
    id: string;
    name: string;
    cuisine_types: string[] | null;
    is_open: boolean;
    is_active: boolean;
  } | null;
}

/**
 * bbox 안에서 현재 영업 위치를 공개한(status='live') 푸드트럭.
 * 식당은 home base(delivery_restaurants.lat/lng) 기준이라 nearby API로 받고,
 * 푸드트럭은 움직이므로 live 위치를 별도 합성한다.
 * RLS("anyone can read truck locations of active restaurants")로 anon 조회 가능 —
 * DeliveryHomeClient 패턴대로 브라우저 supabase 클라이언트 직접 사용.
 */
export async function fetchLiveTrucks(
  supabase: SupabaseClient,
  bbox: BoundingBox,
): Promise<DeliveryPlace[]> {
  const { data, error } = await supabase
    .from('delivery_truck_locations')
    .select('id, restaurant_id, lat, lng, label, restaurant:delivery_restaurants(id, name, cuisine_types, is_open, is_active)')
    .eq('status', 'live')
    .gte('lat', bbox.south)
    .lte('lat', bbox.north)
    .gte('lng', bbox.west)
    .lte('lng', bbox.east)
    .limit(500);

  if (error || !data) return [];

  return (data as unknown as LiveTruckRow[])
    .filter((r) => r.restaurant && r.restaurant.is_active)
    .map((r) => ({
      id: r.restaurant_id, // 마커 클릭 → 기존 식당 상세(restaurants/[id])
      name: r.restaurant!.name,
      description: r.label,
      placeType: 'food_truck' as const,
      cuisineTypes: r.restaurant!.cuisine_types ?? [],
      address: r.label,
      lat: Number(r.lat),
      lng: Number(r.lng),
      rating: 0,
      ratingCount: 0,
      isOpen: r.restaurant!.is_open,
      thumbnailUrl: null,
    }));
}

/** DeliveryPlace[] → map-core MarkerData[]. 원본은 meta.place 로 보존. */
export function placesToMarkers(places: DeliveryPlace[]): MarkerData[] {
  return places.map((p) => ({
    id: p.id,
    position: { lng: p.lng, lat: p.lat },
    title: p.name,
    description: p.cuisineTypes.length ? p.cuisineTypes.join(' · ') : (p.address ?? undefined),
    meta: { place: p },
  }));
}

/** MarkerData(클릭 결과)에서 원본 DeliveryPlace 복원. */
export function placeFromMarker(marker: MarkerData): DeliveryPlace | null {
  const place = marker.meta?.place;
  return place ? (place as DeliveryPlace) : null;
}
