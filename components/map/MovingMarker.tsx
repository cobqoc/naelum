"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMap } from "./MapContext";
import type { LngLat } from "./types";

export interface MovingMarkerProps {
  position: LngLat;
  renderMarker?: () => HTMLElement;
  popupContent?: string;
  // 이전 위치 → 새 위치로 부드럽게 이동 (ms)
  transitionDuration?: number;
}

function defaultMovingEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:36px;height:36px;border-radius:50%;background:#1a73e8;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer";
  el.textContent = "🛵";
  return el;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function MovingMarker({
  position,
  renderMarker,
  popupContent,
  transitionDuration = 800,
}: MovingMarkerProps) {
  const map = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const prevPosRef = useRef<LngLat>(position);
  const animRef = useRef<number | null>(null);

  // 최초 마커 생성
  useEffect(() => {
    const el = renderMarker ? renderMarker() : defaultMovingEl();
    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    if (popupContent) {
      marker.setPopup(
        new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(popupContent),
      );
    }

    markerRef.current = marker;
    prevPosRef.current = position;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      marker.remove();
      markerRef.current = null;
    };
    // 마커는 mount 시 한 번만 생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // position 변경 시 부드러운 이동 (requestAnimationFrame 보간)
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const from = prevPosRef.current;
    // position 객체 전체가 아니라 좌표값에만 반응 — deps([position.lng, position.lat])와 일치
    const to = { lng: position.lng, lat: position.lat };
    if (from.lng === to.lng && from.lat === to.lat) return;

    const start = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - start) / transitionDuration, 1);
      const eased = easeOutCubic(t);
      marker.setLngLat([
        from.lng + (to.lng - from.lng) * eased,
        from.lat + (to.lat - from.lat) * eased,
      ]);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = to;
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [position.lng, position.lat, transitionDuration]);

  return null;
}
