export interface LngLat {
  lng: number;
  lat: number;
}

export interface MapViewState {
  center: LngLat;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MarkerData {
  id: string;
  position: LngLat;
  title?: string;
  description?: string;
  // 앱에서 자유롭게 붙이는 메타데이터
  meta?: Record<string, unknown>;
}

export interface RoutePoint {
  position: LngLat;
  label?: string;
}

export interface MapEvents {
  onMoveEnd?: (viewState: MapViewState) => void;
  onZoomEnd?: (zoom: number) => void;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onClick?: (position: LngLat) => void;
}
