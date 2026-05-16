"use client";

import { useEffect, useId } from "react";
import { useMap } from "./MapContext";
import type { LngLat } from "./types";

export interface RouteLayerProps {
  waypoints: LngLat[];
  color?: string;
  width?: number;
  opacity?: number;
  dashed?: boolean;
}

export function RouteLayer({
  waypoints,
  color = "#0066ff",
  width = 4,
  opacity = 0.9,
  dashed = false,
}: RouteLayerProps) {
  const map = useMap();
  // 여러 RouteLayer가 동시에 있어도 ID 충돌 없도록
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    if (waypoints.length < 2) return;

    const sourceId = `route-source-${id}`;
    const layerId = `route-layer-${id}`;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: waypoints.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    };

    map.addSource(sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dashed ? { "line-dasharray": [2, 1.5] } : {}),
      },
    });

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, id, waypoints, color, width, opacity, dashed]);

  return null;
}
