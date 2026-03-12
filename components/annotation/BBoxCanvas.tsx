"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label_type: string;
  explanation: string;
}

const LABEL_TYPES = [
  "路牌", "植被", "建筑", "道路", "水体", "山脉",
  "车辆", "人物", "天空", "地形地貌", "文字", "其他",
];

const LABEL_COLORS: Record<string, string> = {
  路牌: "#ef4444", 植被: "#22c55e", 建筑: "#3b82f6", 道路: "#f59e0b",
  水体: "#06b6d4", 山脉: "#8b5cf6", 车辆: "#f97316", 人物: "#ec4899",
  天空: "#6366f1", 地形地貌: "#84cc16", 文字: "#14b8a6", 其他: "#64748b",
};

interface Props {
  imageUrl: string;
  bboxes: BBox[];
  onChange: (bboxes: BBox[]) => void;
}

export default function BBoxCanvas({ imageUrl, bboxes, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const [selectedLabel, setSelectedLabel] = useState(LABEL_TYPES[0]);

  const updateImgRect = useCallback(() => {
    if (imgRef.current) {
      setImgRect(imgRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver(updateImgRect);
    if (imgRef.current) obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, [updateImgRect]);

  const toRelative = useCallback(
    (clientX: number, clientY: number) => {
      if (!imgRect) return { x: 0, y: 0 };
      const x = Math.max(0, Math.min(1, (clientX - imgRect.left) / imgRect.width));
      const y = Math.max(0, Math.min(1, (clientY - imgRect.top) / imgRect.height));
      return { x, y };
    },
    [imgRect]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    updateImgRect();
    const pos = toRelative(e.clientX, e.clientY);
    setStart(pos);
    setCurrent(pos);
    setDrawing(true);
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    setCurrent(toRelative(e.clientX, e.clientY));
  };

  const onMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);
    if (width < 0.01 || height < 0.01) return;
    const newBox: BBox = {
      id: crypto.randomUUID(),
      x, y, width, height,
      label_type: selectedLabel,
      explanation: "",
    };
    onChange([...bboxes, newBox]);
  };

  const removeBox = (id: string) => {
    onChange(bboxes.filter((b) => b.id !== id));
  };

  const updateBox = (id: string, field: keyof BBox, value: string) => {
    onChange(bboxes.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const getBoxStyle = (box: BBox, rect: DOMRect) => ({
    left: box.x * rect.width,
    top: box.y * rect.height,
    width: box.width * rect.width,
    height: box.height * rect.height,
    borderColor: LABEL_COLORS[box.label_type] ?? "#64748b",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">标签：</span>
        {LABEL_TYPES.map((label) => (
          <button
            key={label}
            onClick={() => setSelectedLabel(label)}
            className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
              selectedLabel === label
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
            style={
              selectedLabel === label
                ? { backgroundColor: LABEL_COLORS[label] }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative select-none cursor-crosshair rounded-lg overflow-hidden border border-border"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="标注图片"
          className="w-full h-auto block pointer-events-none"
          onLoad={updateImgRect}
          draggable={false}
        />

        {imgRect &&
          bboxes.map((box) => {
            const style = getBoxStyle(box, imgRect);
            return (
              <div
                key={box.id}
                className="absolute border-2 pointer-events-none"
                style={{ ...style, position: "absolute" }}
              >
                <span
                  className="absolute -top-5 left-0 text-xs px-1 py-0.5 rounded-sm text-white whitespace-nowrap"
                  style={{ backgroundColor: LABEL_COLORS[box.label_type] ?? "#64748b" }}
                >
                  {box.label_type}
                </span>
              </div>
            );
          })}

        {drawing && imgRect && (
          <div
            className="absolute border-2 border-dashed border-white pointer-events-none"
            style={{
              left: Math.min(start.x, current.x) * imgRect.width,
              top: Math.min(start.y, current.y) * imgRect.height,
              width: Math.abs(current.x - start.x) * imgRect.width,
              height: Math.abs(current.y - start.y) * imgRect.height,
            }}
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        在图片上拖拽绘制矩形框，已标注 {bboxes.length} 个区域
      </p>

      {bboxes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">标注列表</p>
          {bboxes.map((box, i) => (
            <div key={box.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-accent/20">
              <div
                className="mt-1 h-3 w-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: LABEL_COLORS[box.label_type] }}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">#{i + 1}</span>
                  <select
                    value={box.label_type}
                    onChange={(e) => updateBox(box.id, "label_type", e.target.value)}
                    className="text-xs border border-border rounded bg-background px-1 py-0.5"
                  >
                    {LABEL_TYPES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={box.explanation}
                  onChange={(e) => updateBox(box.id, "explanation", e.target.value)}
                  placeholder="添加说明（可选）"
                  className="w-full text-xs border border-border rounded bg-background px-2 py-1"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeBox(box.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
