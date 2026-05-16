import type { LngLat } from "./types";

export interface GeocoderResult {
  title: string;
  address: string;
  position: LngLat;
}

interface VWorldItem {
  title: string;
  point: { x: string; y: string };
  address?: { road?: string; parcel?: string };
}

// V-World 장소/주소 통합 검색
export async function vworldSearch(
  query: string,
  apiKey: string,
): Promise<GeocoderResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    service: "search",
    request: "search",
    version: "2.0",
    crs: "EPSG:4326",
    query,
    type: "place",
    key: apiKey,
    format: "json",
    size: "7",
    page: "1",
  });

  const res = await fetch(`https://api.vworld.kr/req/search?${params}`);
  if (!res.ok) return [];

  const json = await res.json();
  const items = json?.response?.result?.items ?? [];

  return items.map((item: VWorldItem) => ({
    title: item.title.replace(/<[^>]+>/g, ""),
    address: item.address?.road ?? item.address?.parcel ?? "",
    position: {
      lng: parseFloat(item.point.x),
      lat: parseFloat(item.point.y),
    },
  }));
}
