"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Plus, Target, Info, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  路牌: "#ef4444", 植被: "#10b981", 建筑: "#3b82f6", 道路: "#f59e0b",
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 p-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/5">
        {LABEL_TYPES.map((label) => (
          <button
            key={label}
            onClick={() => setSelectedLabel(label)}
            className={cn(
               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
               selectedLabel === label
                 ? "text-white shadow-lg scale-105"
                 : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
            style={
              selectedLabel === label
                ? { backgroundColor: LABEL_COLORS[label], boxShadow: `0 8px 20px ${LABEL_COLORS[label]}44` }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative select-none cursor-crosshair rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-black/20 group"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="标注图片"
          className="w-full h-auto block pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]"
          onLoad={updateImgRect}
          draggable={false}
        />

        {imgRect &&
          bboxes.map((box) => {
            const style = getBoxStyle(box, imgRect);
            return (
              <div
                key={box.id}
                className="absolute border-2 pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{ ...style, position: "absolute" }}
              >
                <div
                  className="absolute -top-6 left-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-t-md text-white whitespace-nowrap shadow-md"
                  style={{ backgroundColor: LABEL_COLORS[box.label_type] ?? "#64748b" }}
                >
                  {box.label_type}
                </div>
              </div>
            );
          })}

        {drawing && imgRect && (
          <div
            className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none"
            style={{
              left: Math.min(start.x, current.x) * imgRect.width,
              top: Math.min(start.y, current.y) * imgRect.height,
              width: Math.abs(current.x - start.x) * imgRect.width,
              height: Math.abs(current.y - start.y) * imgRect.height,
            }}
          />
        )}

        {/* Floating Tooltip */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
           按住并拖动以绘制标注区域
        </div>
      </div>

      <div className="flex items-center gap-3 px-2">
         <div className="h-px flex-1 bg-white/10" />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
           已捕获 {bboxes.length} 个地理锚点
         </p>
         <div className="h-px flex-1 bg-white/10" />
      </div>

      {bboxes.length > 0 && (
        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {bboxes.map((box, i) => (
            <div key={box.id} className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group/item">
              <div
                className="mt-1 h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ backgroundColor: LABEL_COLORS[box.label_type], boxShadow: `0 4px 12px ${LABEL_COLORS[box.label_type]}44` }}
              >
                 <span className="text-xs font-black">{i + 1}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                     <select
                       value={box.label_type}
                       onChange={(e) => updateBox(box.id, "label_type", e.target.value)}
                       className="appearance-none text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                     >
                       {LABEL_TYPES.map((l) => (
                         <option key={l} value={l}>{l}</option>
                       ))}
                     </select>
                     <Tag size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="relative">
                   <input
                     type="text"
                     value={box.explanation}
                     onChange={(e) => updateBox(box.id, "explanation", e.target.value)}
                     placeholder="添加识别依据或特征说明..."
                     className="w-full text-xs font-medium bg-transparent border-b border-slate-100 px-0 py-1 focus:outline-none focus:border-primary transition-colors"
                   />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover/item:opacity-100 transition-all"
                onClick={() => removeBox(box.id)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
