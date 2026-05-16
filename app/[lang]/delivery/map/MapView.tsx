'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map,
  MarkerLayer,
  useMap,
  createVWorldStyle,
  type BoundingBox,
  type MarkerData,
} from '@/components/map';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import {
  fetchNearbyPlaces,
  fetchLiveTrucks,
  placesToMarkers,
  placeFromMarker,
  type DeliveryPlace,
} from '@/lib/delivery/places';

// 서울 시청 — 데이터에 좌표 없을 때의 기본 뷰
const DEFAULT_VIEW = { center: { lng: 126.9784, lat: 37.5666 }, zoom: 13 };

// 지도 첫 로드 시 한 번 현재 bounds 로 fetch (moveend 는 사용자 조작 시에만 발생)
function BoundsWatcher({ onBounds }: { onBounds: (b: BoundingBox) => void }) {
  const map = useMap();
  useEffect(() => {
    const b = map.getBounds();
    onBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function markerEl(place: DeliveryPlace): HTMLElement {
  const el = document.createElement('div');
  const ring = place.isOpen ? '#4caf50' : '#888888';
  const emoji = place.placeType === 'food_truck' ? '🚚' : '🍴';
  el.style.cssText =
    `width:34px;height:34px;border-radius:50%;background:#2d2d2d;border:3px solid ${ring};` +
    `display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;` +
    `box-shadow:0 2px 6px rgba(0,0,0,0.4);transition:transform .15s`;
  el.textContent = emoji;
  el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.15)'));
  el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));
  return el;
}

export default function MapView() {
  const { t, language } = useI18n();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const vworldKey = process.env.NEXT_PUBLIC_VWORLD_KEY;
  const mapStyle = useMemo(
    () => (vworldKey ? createVWorldStyle(vworldKey) : undefined),
    [vworldKey],
  );

  const handleBounds = useCallback(
    async (bbox: BoundingBox) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);

      // 식당: home base 기준(nearby API) / 푸드트럭: live 위치 합성
      const [restaurants, trucks] = await Promise.all([
        fetchNearbyPlaces(bbox, { placeType: 'restaurant', signal: ac.signal }),
        fetchLiveTrucks(supabase, bbox),
      ]);
      if (ac.signal.aborted) return;

      // 주의: 위에서 map-core 의 Map 컴포넌트를 import 했으므로 전역 Map 생성자 사용 불가.
      // 객체 키로 중복 제거 (식당·트럭 id 충돌 시 뒤(트럭) 우선)
      const byId: Record<string, DeliveryPlace> = {};
      for (const p of [...restaurants, ...trucks]) byId[p.id] = p;
      setMarkers(placesToMarkers(Object.values(byId)));
      setLoading(false);
      setFetched(true);
    },
    [supabase],
  );

  const handleMarkerClick = useCallback(
    (m: MarkerData) => {
      const place = placeFromMarker(m);
      if (place) router.push(`/${language}/delivery/restaurants/${place.id}`);
    },
    [router, language],
  );

  const renderMarker = useCallback(
    (m: MarkerData) => {
      const place = placeFromMarker(m);
      return place ? markerEl(place) : document.createElement('div');
    },
    [],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const showEmpty = fetched && !loading && markers.length === 0;

  return (
    <>
      <Map initialView={DEFAULT_VIEW} mapStyle={mapStyle} onBoundsChange={handleBounds}>
        <BoundsWatcher onBounds={handleBounds} />
        <MarkerLayer markers={markers} renderMarker={renderMarker} onMarkerClick={handleMarkerClick} />
      </Map>

      {/* 범례 */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-background-secondary/90 border border-white/10">
          🍴 {t.delivery.map.restaurant}
        </span>
        <span className="px-2 py-1 rounded-full bg-background-secondary/90 border border-white/10">
          🚚 {t.delivery.map.foodTruck}
        </span>
      </div>

      {/* 상태 pill */}
      {(loading || showEmpty) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <span className="px-4 py-2 rounded-full bg-background-secondary/95 border border-white/10 text-sm text-text-secondary shadow-lg">
            {loading ? t.delivery.map.loading : t.delivery.map.empty}
          </span>
        </div>
      )}
    </>
  );
}
