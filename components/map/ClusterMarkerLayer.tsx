"use client";

import { useEffect, useId, useCallback } from "react";
import maplibregl, { type MapMouseEvent, type MapGeoJSONFeature } from "maplibre-gl";
import { useMap } from "./MapContext";
import type { MarkerData } from "./types";

export interface ClusterMarkerLayerProps<T extends MarkerData = MarkerData> {
  markers: T[];
  color?: string;
  onMarkerClick?: (marker: T) => void;
  clusterRadius?: number;
  clusterMaxZoom?: number;
}

export function ClusterMarkerLayer<T extends MarkerData = MarkerData>({
  markers,
  color = "#ff5a5f",
  onMarkerClick,
  clusterRadius = 50,
  clusterMaxZoom = 14,
}: ClusterMarkerLayerProps<T>) {
  const map = useMap();
  const id = useId().replace(/:/g, "");

  const sourceId = `cluster-src-${id}`;
  const clusterCircleId = `cluster-circle-${id}`;
  const clusterCountId = `cluster-count-${id}`;
  const pointId = `cluster-point-${id}`;

  // 클릭 핸들러를 useCallback으로 안정화
  const handleClusterClick = useCallback(
    (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const clusterId = feature.properties?.cluster_id as number;
      const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      // maplibre-gl v4: getClusterExpansionZoom 는 Promise 반환 (콜백형 폐기)
      src.getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          if (zoom == null) return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom });
        })
        .catch(() => {});
    },
    [map, sourceId],
  );

  const handlePointClick = useCallback(
    (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = e.features?.[0];
      if (!feature || !onMarkerClick) return;
      const markerId = feature.properties?.id as string;
      const marker = markers.find((m) => m.id === markerId);
      if (marker) onMarkerClick(marker);
    },
    [markers, onMarkerClick],
  );

  useEffect(() => {
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: markers.map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.position.lng, m.position.lat] },
        properties: { id: m.id, title: m.title ?? "", description: m.description ?? "" },
      })),
    };

    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom,
      clusterRadius,
    });

    // 클러스터 원
    map.addLayer({
      id: clusterCircleId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step", ["get", "point_count"],
          color, 10, shiftHue(color, -20), 50, shiftHue(color, -40),
        ],
        "circle-radius": ["step", ["get", "point_count"], 22, 10, 30, 50, 38],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.9,
      },
    });

    // 클러스터 숫자
    map.addLayer({
      id: clusterCountId,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
      },
      paint: { "text-color": "#fff" },
    });

    // 개별 마커
    map.addLayer({
      id: pointId,
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color,
        "circle-radius": 9,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#fff",
      },
    });

    map.on("click", clusterCircleId, handleClusterClick);
    map.on("click", pointId, handlePointClick);

    // 커서 스타일
    const setCrosshair = () => (map.getCanvas().style.cursor = "pointer");
    const setDefault = () => (map.getCanvas().style.cursor = "");
    map.on("mouseenter", clusterCircleId, setCrosshair);
    map.on("mouseleave", clusterCircleId, setDefault);
    map.on("mouseenter", pointId, setCrosshair);
    map.on("mouseleave", pointId, setDefault);

    return () => {
      map.off("click", clusterCircleId, handleClusterClick);
      map.off("click", pointId, handlePointClick);
      map.off("mouseenter", clusterCircleId, setCrosshair);
      map.off("mouseleave", clusterCircleId, setDefault);
      map.off("mouseenter", pointId, setCrosshair);
      map.off("mouseleave", pointId, setDefault);
      [clusterCountId, clusterCircleId, pointId].forEach((l) => {
        if (map.getLayer(l)) map.removeLayer(l);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [
    map, markers, color, clusterRadius, clusterMaxZoom,
    sourceId, clusterCircleId, clusterCountId, pointId,
    handleClusterClick, handlePointClick,
  ]);

  return null;
}

// 색상 색조(hue) 이동 — 클러스터 크기별 색 구분용
function shiftHue(hex: string, deg: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  h = (h * 360 + deg + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(toRgb(h + 1/3))}${toHex(toRgb(h))}${toHex(toRgb(h - 1/3))}`;
}
