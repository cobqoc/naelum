"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMap } from "./MapContext";
import { vworldSearch, type GeocoderResult } from "./geocoder";

export interface SearchControlProps {
  apiKey: string;
  onSelect?: (result: GeocoderResult) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function SearchControl({
  apiKey,
  onSelect,
  placeholder = "주소 또는 장소 검색",
  style,
}: SearchControlProps) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocoderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) { setResults([]); setOpen(false); return; }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        const res = await vworldSearch(q, apiKey);
        setResults(res);
        setOpen(res.length > 0);
        setLoading(false);
      }, 350);
    },
    [apiKey],
  );

  const handleSelect = useCallback(
    (result: GeocoderResult) => {
      setQuery(result.title);
      setOpen(false);
      setResults([]);
      map.flyTo({ center: [result.position.lng, result.position.lat], zoom: 17, duration: 800 });
      onSelect?.(result);
    },
    [map, onSelect],
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: 320, ...style }}>
      <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <span style={{ padding: "0 12px", color: "#999", fontSize: 16 }}>🔍</span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none", padding: "12px 12px 12px 0",
            fontSize: 14, background: "transparent",
          }}
        />
        {loading && <span style={{ padding: "0 12px", color: "#999", fontSize: 12 }}>...</span>}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16 }}
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          listStyle: "none", margin: 0, padding: "6px 0", zIndex: 100, maxHeight: 280, overflowY: "auto",
        }}>
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{ padding: "10px 16px", cursor: "pointer", borderBottom: i < results.length - 1 ? "1px solid #f5f5f5" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
              {r.address && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{r.address}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
