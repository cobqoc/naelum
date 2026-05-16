import { createContext, useContext } from "react";
import type { Map as MlMap } from "maplibre-gl";

const MapContext = createContext<MlMap | null>(null);

export { MapContext };

export function useMap(): MlMap {
  const map = useContext(MapContext);
  if (!map) throw new Error("useMap must be used inside <Map>");
  return map;
}
