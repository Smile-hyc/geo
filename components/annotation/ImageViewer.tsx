"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  src: string;
  alt?: string;
  className?: string;
}

export default function ImageViewer({ src, alt = "图片", className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoom = (delta: number) => {
    setScale((s) => Math.min(4, Math.max(0.5, s + delta)));
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.1 : -0.1);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + e.clientX - dragStart.current.x,
      y: dragStart.current.oy + e.clientY - dragStart.current.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  }, [scale]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border bg-black/20 ${className}`}>
      <div
        ref={containerRef}
        className="overflow-hidden relative"
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-auto block transition-transform"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transformOrigin: "center",
            userSelect: "none",
          }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur rounded-lg p-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => zoom(0.2)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => zoom(-0.2)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
