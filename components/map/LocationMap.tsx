"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapDisplay = dynamic(() => import("@/components/map/MapDisplay"), {
  ssr: false,
});

export default function LocationMap({
  lat,
  lng,
  label,
  description,
  height = "220px",
}: {
  lat: number;
  lng: number;
  label?: string;
  description?: string;
  height?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-accent/20 px-4 py-3">
        <div>
          <p className="text-sm font-medium">
            {label ?? "真实位置"}
          </p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <MapPin className="h-3.5 w-3.5" />
          {lat.toFixed(3)}, {lng.toFixed(3)}
        </div>
      </div>
      <MapDisplay
        markers={[{ lat, lng, label: "真实位置", color: "#ef4444" }]}
        height={height}
      />
    </div>
  );
}
