"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMap } from "./MapContext";
import type { LngLat } from "./types";

export interface DraggableMarkerProps {
  position: LngLat;
  onChange: (position: LngLat) => void;
  color?: string;
}

export function DraggableMarker({ position, onChange, color = "#1a73e8" }: DraggableMarkerProps) {
  const map = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = `
      width: 32px; height: 42px; cursor: grab; position: relative;
    `;
    el.innerHTML = `
      <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
      </svg>
    `;

    const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: "bottom" })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lng, lat } = marker.getLngLat();
      onChange({ lng, lat });
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // 외부에서 position이 바뀌면 (예: 검색으로 이동) 마커 위치 동기화
  useEffect(() => {
    markerRef.current?.setLngLat([position.lng, position.lat]);
  }, [position.lng, position.lat]);

  return null;
}
