"use client";

import { useEffect, useRef } from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

interface Props {
  markers: MapMarker[];
  height?: string;
  drawLines?: boolean;
}

export default function MapDisplay({ markers, height = "300px", drawLines = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

      import("leaflet").then((L) => {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

      const map = L.map(containerRef.current!).setView([30, 105], 3);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      if (markers.length === 0) return;

      const bounds: [number, number][] = [];

      markers.forEach((m) => {
        const icon = L.divIcon({
          html: `<div style="background:${m.color ?? "#3b82f6"};color:white;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;font-weight:600">${m.label}</div>`,
          className: "",
          iconAnchor: [0, 0],
        });
        L.marker([m.lat, m.lng], { icon }).addTo(map);
        bounds.push([m.lat, m.lng]);
      });

      if (drawLines && markers.length >= 2) {
        for (let i = 0; i < markers.length - 1; i += 2) {
          L.polyline(
            [[markers[i].lat, markers[i].lng], [markers[i + 1].lat, markers[i + 1].lng]],
            { color: "#ef4444", dashArray: "6", weight: 2 }
          ).addTo(map);
        }
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 8);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const bounds: [number, number][] = [];
      markers.forEach((m) => {
        const icon = L.divIcon({
          html: `<div style="background:${m.color ?? "#3b82f6"};color:white;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;font-weight:600">${m.label}</div>`,
          className: "",
          iconAnchor: [0, 0],
        });
        L.marker([m.lat, m.lng], { icon }).addTo(map);
        bounds.push([m.lat, m.lng]);
      });

      if (drawLines && markers.length >= 2) {
        for (let i = 0; i < markers.length - 1; i += 2) {
          L.polyline(
            [[markers[i].lat, markers[i].lng], [markers[i + 1].lat, markers[i + 1].lng]],
            { color: "#ef4444", dashArray: "6", weight: 2 }
          ).addTo(map);
        }
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }, [markers, drawLines]);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
