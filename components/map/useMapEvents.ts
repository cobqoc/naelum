import { useEffect } from "react";
import type { Map as MlMap, MapMouseEvent } from "maplibre-gl";
import type { MapEvents, MapViewState, BoundingBox } from "./types";

export function useMapEvents(map: MlMap | null, events: MapEvents) {
  useEffect(() => {
    if (!map) return;
    const { onMoveEnd, onZoomEnd, onBoundsChange, onClick } = events;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      const viewState: MapViewState = {
        center: { lng: center.lng, lat: center.lat },
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      };
      onMoveEnd?.(viewState);
      if (onBoundsChange) {
        const b = map.getBounds();
        const bounds: BoundingBox = {
          west: b.getWest(),
          south: b.getSouth(),
          east: b.getEast(),
          north: b.getNorth(),
        };
        onBoundsChange(bounds);
      }
    };

    const handleZoomEnd = () => onZoomEnd?.(map.getZoom());
    const handleClick = (e: MapMouseEvent) =>
      onClick?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });

    if (onMoveEnd || onBoundsChange) map.on("moveend", handleMoveEnd);
    if (onZoomEnd) map.on("zoomend", handleZoomEnd);
    if (onClick) map.on("click", handleClick);

    return () => {
      if (onMoveEnd || onBoundsChange) map.off("moveend", handleMoveEnd);
      if (onZoomEnd) map.off("zoomend", handleZoomEnd);
      if (onClick) map.off("click", handleClick);
    };
  }, [map, events]);
}
