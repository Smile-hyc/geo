"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getNextTask, getTempFileURL, submitAnnotation } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const BRUSH_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff"];
const BRUSH_SIZES = [2, 4, 8, 12];

interface Task {
  id: number;
  storage_url: string;
  mode_tags: string[];
  imageUrl?: string;
}

function DrawingImage({
  src,
  width,
  height,
}: {
  src: string | null;
  width: number;
  height: number;
}) {
  const [img] = useImage(src ?? "", "anonymous");
  if (!img) return null;
  const scale = Math.min(width / img.width, height / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  return <KonvaImage image={img} x={x} y={y} width={w} height={h} listening={false} />;
}

export default function PlayContent() {
  const user = useAuthStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<{ points: number[]; stroke: string; strokeWidth: number }[]>([]);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [stroke, setStroke] = useState(BRUSH_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [thoughtProcess, setThoughtProcess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNextTask();
      const t = res.task;
      if (!t) {
        setTask(null);
        setImageUrl(null);
        return;
      }
      let url = t.storage_url;
      if (url.startsWith("cloud://") || url.startsWith("cos://")) {
        const { tempFileURL } = await getTempFileURL(url);
        url = tempFileURL;
      }
      setTask({ id: t.id, storage_url: t.storage_url, mode_tags: t.mode_tags ?? [], imageUrl: url });
      setImageUrl(url);
      setLines([]);
      setCurrentLine([]);
      setThoughtProcess("");
      setSubmitDone(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载题目失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => {
      const w = Math.min(el.clientWidth, 900);
      const h = Math.min(Math.floor(w * 0.6), 520);
      setStageSize({ width: w, height: h });
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (submitDone || !task) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setCurrentLine([pos.x, pos.y]);
  };

  const handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (submitDone || !task || currentLine.length === 0) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setCurrentLine((prev) => prev.concat([pos.x, pos.y]));
  };

  const handlePointerUp = () => {
    if (currentLine.length >= 4) {
      setLines((prev) => [...prev, { points: currentLine, stroke, strokeWidth }]);
    }
    setCurrentLine([]);
  };

  const undo = () => setLines((prev) => prev.slice(0, -1));
  const clear = () => setLines([]);

  const exportToBase64 = useCallback(async (): Promise<string> => {
    const stage = stageRef.current;
    if (!stage) throw new Error("画布未就绪");
    const dataUrl = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.85,
      pixelRatio: 1,
    });
    if (typeof dataUrl === "string") return dataUrl;
    return await (dataUrl as Promise<string>);
  }, []);

  const handleSubmit = async () => {
    if (!task || submitting || submitDone) return;
    const text = thoughtProcess.trim();
    if (!text) {
      setError("请填写推理思维过程");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let base64 = await exportToBase64();
      if (base64.indexOf(",") >= 0) base64 = base64.split(",")[1]!;
      const modeType = task.mode_tags[0] ?? "street_view";
      await submitAnnotation({
        image_id: task.id,
        mode_type: modeType,
        annotation_type: "reasoning",
        thought_text: text,
        final_answer: text,
        confidence: 50,
        cloudbase_uid: user?.uid,
        email: user?.email,
        annotated_image_base64: base64,
      });
      setSubmitDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !task) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <p className="text-muted-foreground">加载题目中…</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">暂无题目，请先在管理后台上传。</p>
        <Link href="/admin">
          <Button variant="outline">去管理后台</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">返回首页</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">地理推理 · 标注证据</h1>
          <Link href="/">
            <Button variant="ghost" size="sm">返回首页</Button>
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/15 text-destructive px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div ref={containerRef} className="rounded-xl overflow-hidden border border-border bg-card">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: "crosshair" }}
          >
            <Layer>
              <DrawingImage
                src={imageUrl}
                width={stageSize.width}
                height={stageSize.height}
              />
            </Layer>
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              ))}
              {currentLine.length >= 2 && (
                <Line
                  points={currentLine}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">画笔颜色：</span>
          {BRUSH_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-8 h-8 rounded-full border-2 border-border hover:ring-2 ring-primary transition"
              style={{ backgroundColor: c }}
              onClick={() => setStroke(c)}
              aria-label={`颜色 ${c}`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">粗细：</span>
          {BRUSH_SIZES.map((s) => (
            <Button
              key={s}
              type="button"
              variant={strokeWidth === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStrokeWidth(s)}
            >
              {s}
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={undo} disabled={lines.length === 0}>
            撤销
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clear} disabled={lines.length === 0}>
            清空
          </Button>
        </div>

        <div className="space-y-2">
          <Label>推理思维过程</Label>
          <Textarea
            placeholder="根据图片中的细节（建筑、文字、植被、地貌等）写出你的推理过程…"
            value={thoughtProcess}
            onChange={(e) => setThoughtProcess(e.target.value)}
            className="min-h-[120px] resize-y"
            disabled={submitDone}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || submitDone}
          >
            {submitting ? "提交中…" : submitDone ? "已提交" : "提交答案"}
          </Button>
          {submitDone && (
            <Button variant="outline" onClick={loadQuestion}>
              下一题
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
