"use client";

import { useEffect, useId, useMemo } from "react";
import { useMap } from "./MapContext";
import type { LngLat } from "./types";

export interface CircleLayerProps {
  center: LngLat;
  radiusKm: number;
  color?: string;
  opacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

// 위경도 중심 + km 반경으로 원 GeoJSON 생성 (64각 다각형 근사)
function makeCircleGeoJson(center: LngLat, radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const earthRadius = 6371;
  const coords: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const latRad = (center.lat * Math.PI) / 180;
    const dLat = (radiusKm / earthRadius) * Math.cos(rad);
    const dLng = (radiusKm / earthRadius) * Math.sin(rad) / Math.cos(latRad);
    coords.push([
      center.lng + (dLng * 180) / Math.PI,
      center.lat + (dLat * 180) / Math.PI,
    ]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

export function CircleLayer({
  center,
  radiusKm,
  color = "#0066ff",
  opacity = 0.15,
  strokeColor = "#0066ff",
  strokeWidth = 2,
}: CircleLayerProps) {
  const map = useMap();
  const id = useId().replace(/:/g, "");

  const geojson = useMemo(
    () => makeCircleGeoJson(center, radiusKm),
    [center, radiusKm],
  );

  useEffect(() => {
    const sourceId = `circle-${id}`;
    const fillId = `${sourceId}-fill`;
    const strokeId = `${sourceId}-stroke`;

    map.addSource(sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: fillId,
      type: "fill",
      source: sourceId,
      paint: { "fill-color": color, "fill-opacity": opacity },
    });
    map.addLayer({
      id: strokeId,
      type: "line",
      source: sourceId,
      paint: { "line-color": strokeColor, "line-width": strokeWidth },
    });

    return () => {
      [fillId, strokeId].forEach((l) => { if (map.getLayer(l)) map.removeLayer(l); });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, id, geojson, color, opacity, strokeColor, strokeWidth]);

  return null;
}
