"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMap } from "./MapContext";
import type { MarkerData } from "./types";

export interface MarkerLayerProps<T extends MarkerData = MarkerData> {
  markers: T[];
  // 커스텀 마커 엘리먼트 — 없으면 기본 핀 사용
  renderMarker?: (marker: T) => HTMLElement;
  onMarkerClick?: (marker: T) => void;
  onMarkerHover?: (marker: T | null) => void;
}

function defaultMarkerEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:24px;height:24px;border-radius:50%;background:#ff5a5f;border:2px solid #fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.3);transition:transform .15s";
  el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.2)"));
  el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
  return el;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export function MarkerLayer<T extends MarkerData = MarkerData>({
  markers,
  renderMarker,
  onMarkerClick,
  onMarkerHover,
}: MarkerLayerProps<T>) {
  const map = useMap();
  const instancesRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    instancesRef.current.forEach((m) => m.remove());
    instancesRef.current = [];

    markers.forEach((data) => {
      const el = renderMarker ? renderMarker(data) : defaultMarkerEl();

      if (onMarkerClick) el.addEventListener("click", () => onMarkerClick(data));
      if (onMarkerHover) {
        el.addEventListener("mouseenter", () => onMarkerHover(data));
        el.addEventListener("mouseleave", () => onMarkerHover(null));
      }

      const popup =
        data.title
          ? new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<strong>${esc(data.title)}</strong>${data.description ? `<p style="margin:4px 0 0;color:#666;font-size:13px">${esc(data.description)}</p>` : ""}`,
            )
          : undefined;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([data.position.lng, data.position.lat]);

      if (popup) marker.setPopup(popup);
      marker.addTo(map);
      instancesRef.current.push(marker);
    });

    return () => {
      instancesRef.current.forEach((m) => m.remove());
      instancesRef.current = [];
    };
  }, [map, markers, renderMarker, onMarkerClick, onMarkerHover]);

  return null;
}
