'use client';

import { useMemo } from 'react';
import {
  Map,
  DraggableMarker,
  SearchControl,
  createVWorldStyle,
} from '@/components/map';

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  // null = 아직 좌표 미지정 (식당 좌표는 nullable)
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  searchPlaceholder?: string;
}

const SEOUL = { lng: 126.9784, lat: 37.5666 }; // 서울 시청 — 좌표 미지정 시 기본 뷰

// 사장님이 식당/푸드트럭 좌표를 지정하는 재사용 피커.
// - 주소·장소 검색(vworldSearch) → 핀 이동 + 지도 이동
// - 지도 클릭 / 핀 드래그로도 지정
// maplibre는 window 의존 → 호출 측에서 dynamic ssr:false 로 로드.
export default function PlaceLocationPicker({ value, onChange, searchPlaceholder }: Props) {
  const vworldKey = process.env.NEXT_PUBLIC_VWORLD_KEY;
  const mapStyle = useMemo(
    () => (vworldKey ? createVWorldStyle(vworldKey) : undefined),
    [vworldKey],
  );

  const center = value ?? SEOUL;
  const pinPos = value ?? SEOUL;

  return (
    <div className="relative w-full h-full">
      <Map
        initialView={{ center, zoom: value ? 15 : 12 }}
        mapStyle={mapStyle}
        className="rounded-xl overflow-hidden"
        onClick={(p) => onChange({ lat: p.lat, lng: p.lng })}
      >
        {vworldKey && (
          <SearchControl
            apiKey={vworldKey}
            placeholder={searchPlaceholder}
            onSelect={(r) => onChange({ lat: r.position.lat, lng: r.position.lng })}
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, width: 260 }}
          />
        )}
        <DraggableMarker
          position={{ lng: pinPos.lng, lat: pinPos.lat }}
          onChange={(p) => onChange({ lat: p.lat, lng: p.lng })}
          color="#ff9966"
        />
      </Map>
    </div>
  );
}
