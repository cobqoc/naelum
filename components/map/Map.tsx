"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapContext } from "./MapContext";
import { useMapEvents } from "./useMapEvents";
import { defaultStyle } from "./tileStyle";
import type { MapViewState, MapEvents } from "./types";

export interface MapProps extends MapEvents {
  initialView: MapViewState;
  // 앱에서 타일 스타일 주입 — 없으면 CartoDB 기본값 사용
  mapStyle?: StyleSpecification;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // WebGL 미지원/초기화 실패 시 지도 대신 보여줄 내용.
  // maplibre는 WebGL 필수 — 일부 브라우저·헤드리스 환경엔 컨텍스트가 없다.
  // 이 경우 throw 시키면 라우트 error boundary가 페이지 전체를 삼키므로
  // 지도만 graceful 하게 대체하고 나머지 UI(폼·버튼 등)는 살린다.
  fallback?: ReactNode;
}

export function Map({
  initialView,
  mapStyle,
  children,
  className,
  style,
  fallback,
  onMoveEnd,
  onZoomEnd,
  onBoundsChange,
  onClick,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle ?? defaultStyle,
        center: [initialView.center.lng, initialView.center.lat],
        zoom: initialView.zoom,
        bearing: initialView.bearing ?? 0,
        pitch: initialView.pitch ?? 0,
      });
    } catch {
      // WebGL 컨텍스트 생성 실패 등 — 페이지를 죽이지 않고 대체 표시
      setFailed(true);
      return;
    }

    try {
      instance.addControl(new maplibregl.NavigationControl(), "top-right");
      instance.addControl(
        new maplibregl.GeolocateControl({ trackUserLocation: true }),
        "top-right",
      );
      instance.addControl(new maplibregl.ScaleControl(), "bottom-left");
    } catch {
      // 컨트롤 추가 실패는 치명적 아님 — 무시
    }

    instance.once("load", () => setMap(instance));

    return () => {
      instance.remove();
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents(map, { onMoveEnd, onZoomEnd, onBoundsChange, onClick });

  if (failed) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2d2d2d",
          color: "#888888",
          fontSize: 13,
          textAlign: "center",
          padding: 16,
          ...style,
        }}
        data-testid="map-unavailable"
      >
        {fallback ?? "지도를 표시할 수 없습니다 (WebGL 미지원)"}
      </div>
    );
  }

  return (
    <MapContext.Provider value={map}>
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%", ...style }}
      />
      {map && children}
    </MapContext.Provider>
  );
}
