// 자체 지도 코어 — map-platform/packages/map-core 에서 vendor-in.
// MapLibre GL + VWorld/OSM 타일. 카카오/네이버 종속 없음.
// 원본 모노레포는 실험·프로토타이핑 sandbox로 유지(/Users/obqo/claude/map-platform).

// 핵심 컴포넌트
export { Map } from "./Map";
export type { MapProps } from "./Map";

export { MovingMarker } from "./MovingMarker";
export type { MovingMarkerProps } from "./MovingMarker";

export { DraggableMarker } from "./DraggableMarker";
export type { DraggableMarkerProps } from "./DraggableMarker";

export { SearchControl } from "./SearchControl";
export type { SearchControlProps } from "./SearchControl";

// 레이어 컴포넌트
export { MarkerLayer } from "./MarkerLayer";
export type { MarkerLayerProps } from "./MarkerLayer";

export { ClusterMarkerLayer } from "./ClusterMarkerLayer";
export type { ClusterMarkerLayerProps } from "./ClusterMarkerLayer";

export { RouteLayer } from "./RouteLayer";
export type { RouteLayerProps } from "./RouteLayer";

export { GeoJsonLayer } from "./GeoJsonLayer";
export type { GeoJsonLayerProps } from "./GeoJsonLayer";

export { CircleLayer } from "./CircleLayer";
export type { CircleLayerProps } from "./CircleLayer";

// 훅
export { useMap } from "./MapContext";

// 유틸
export { vworldSearch } from "./geocoder";
export type { GeocoderResult } from "./geocoder";

// 타입
export type { LngLat, MapViewState, BoundingBox, MarkerData, RoutePoint, MapEvents } from "./types";

// 타일 스타일
export {
  defaultStyle,
  cartoVoyagerStyle,
  osmRasterStyle,
  createVWorldStyle,
  createVWorldSatelliteStyle,
} from "./tileStyle";
