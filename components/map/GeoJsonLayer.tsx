"use client";

import { useEffect, useId } from "react";
import { useMap } from "./MapContext";

export interface GeoJsonLayerProps {
  data: GeoJSON.GeoJSON;
  // 라인 (교통 노선, 배달 경로 등)
  lineColor?: string;
  lineWidth?: number;
  // 폴리곤 (배달 권역, 서비스 범위 등)
  fillColor?: string;
  fillOpacity?: number;
  // 포인트
  circleColor?: string;
  circleRadius?: number;
}

export function GeoJsonLayer({
  data,
  lineColor = "#0066ff",
  lineWidth = 3,
  fillColor = "#0066ff",
  fillOpacity = 0.2,
  circleColor = "#0066ff",
  circleRadius = 6,
}: GeoJsonLayerProps) {
  const map = useMap();
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const sourceId = `geojson-${id}`;
    const lineLayerId = `${sourceId}-line`;
    const fillLayerId = `${sourceId}-fill`;
    const circleLayerId = `${sourceId}-circle`;

    map.addSource(sourceId, { type: "geojson", data });

    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
    });

    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
      paint: { "line-color": lineColor, "line-width": lineWidth },
    });

    map.addLayer({
      id: circleLayerId,
      type: "circle",
      source: sourceId,
      filter: ["==", "$type", "Point"],
      paint: { "circle-color": circleColor, "circle-radius": circleRadius },
    });

    return () => {
      [fillLayerId, lineLayerId, circleLayerId].forEach((l) => {
        if (map.getLayer(l)) map.removeLayer(l);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, id, data, lineColor, lineWidth, fillColor, fillOpacity, circleColor, circleRadius]);

  return null;
}
