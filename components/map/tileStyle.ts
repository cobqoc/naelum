import type { StyleSpecification } from "maplibre-gl";

// V-World (국토지리정보원) — 한국 공식 공공 지도, 무료
// apiKey: NEXT_PUBLIC_VWORLD_KEY 환경변수에서 주입
export function createVWorldStyle(apiKey: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      vworld: {
        type: "raster",
        tiles: [
          `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
        ],
        tileSize: 256,
        attribution: "© 국토지리정보원",
        minzoom: 6,
        maxzoom: 19,
      },
    },
    layers: [{ id: "vworld", type: "raster", source: "vworld" }],
  };
}

export function createVWorldSatelliteStyle(apiKey: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      vworld: {
        type: "raster",
        tiles: [
          `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Satellite/{z}/{y}/{x}.jpeg`,
        ],
        tileSize: 256,
        attribution: "© 국토지리정보원",
        minzoom: 6,
        maxzoom: 19,
      },
    },
    layers: [{ id: "vworld-satellite", type: "raster", source: "vworld" }],
  };
}

// CartoDB — API 키 없이 개발/테스트용
export const cartoVoyagerStyle: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

export const osmRasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const defaultStyle = cartoVoyagerStyle;
