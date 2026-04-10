"use client";

import { useEffect, useRef } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  height?: string;
}

export default function MapPicker({ value, onChange, height = "200px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;

      if ((containerRef.current as any)._leaflet_id) {
        return;
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current).setView([30, 105], 3);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
      }

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        onChange({ lat, lng });
      });
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []); 

  useEffect(() => {
    if (!mapRef.current || !value) return;
    import("leaflet").then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng]);
      } else {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(mapRef.current!);
      }
    });
  }, [value]);

  // 核心修复：监听 height 变化，强制重新渲染地图瓦片
  useEffect(() => {
    if (mapRef.current) {
      // 因为我们的放大动画有大约 300ms 的过渡时间（transition-all）
      // 所以我们延迟一下，等动画结束容器彻底变大后，再告诉地图刷新尺寸
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [height]);

  return (
    <div className="w-full relative transition-all duration-300" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />
    </div>
  );
}