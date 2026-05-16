'use client';

import { useMemo } from 'react';
import { Map, DraggableMarker, createVWorldStyle } from '@/components/map';

interface Props {
  position: { lng: number; lat: number };
  onChange: (pos: { lng: number; lat: number }) => void;
}

// DraggableMarker 로 푸드트럭 현재 위치 지정. maplibre는 window 의존 →
// 호출 측에서 dynamic ssr:false 로 로드.
export default function LocationMap({ position, onChange }: Props) {
  const vworldKey = process.env.NEXT_PUBLIC_VWORLD_KEY;
  const mapStyle = useMemo(
    () => (vworldKey ? createVWorldStyle(vworldKey) : undefined),
    [vworldKey],
  );

  return (
    <Map
      initialView={{ center: position, zoom: 15 }}
      mapStyle={mapStyle}
      className="rounded-xl overflow-hidden"
    >
      <DraggableMarker position={position} onChange={onChange} color="#ff9966" />
    </Map>
  );
}
