"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BBoxCanvas, { type BBox } from "@/components/annotation/BBoxCanvas";
import ThoughtInput, { type ThoughtData } from "@/components/annotation/ThoughtInput";
import { getNextTask, submitAnnotation, getTempFileURL } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { getModeName } from "@/lib/modes";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });

interface Task {
  id: number;
  storage_url: string;
  mode_tags: string[];
  difficulty: number;
  imageUrl?: string;
}

const INIT_THOUGHT: ThoughtData = { thought_text: "", final_answer: "", confidence: 50 };

function AnnotateContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const user = useAuthStore((s) => s.user);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [thought, setThought] = useState<ThoughtData>(INIT_THOUGHT);
  const [guessPos, setGuessPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    setBboxes([]);
    setThought(INIT_THOUGHT);
    setGuessPos(null);
    setSubmitted(false);
    try {
      const res = await getNextTask(mode ? { mode } : undefined);
      if (!res.task) {
        setError("暂无可用任务，请稍后再试");
        setTask(null);
        return;
      }
      let imageUrl = res.task.storage_url;
      if (imageUrl.startsWith("cloud://") || imageUrl.startsWith("cos://")) {
        const r = await getTempFileURL(imageUrl);
        imageUrl = r.tempFileURL;
      }
      setTask({ ...res.task, imageUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载任务失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [mode]);

  const handleSubmit = async () => {
    if (!task) return;
    if (!thought.thought_text.trim()) {
      setError("请填写思维链分析");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitAnnotation({
        image_id: task.id,
        mode_type: mode!,
        thought_text: thought.thought_text,
        final_answer: thought.final_answer,
        confidence: thought.confidence,
        cloudbase_uid: user?.uid,
        email: user?.email,
        bboxes: bboxes.map((b) => ({
          x: b.x, y: b.y, width: b.width, height: b.height,
          label_type: b.label_type, explanation: b.explanation,
        })),
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mode) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">请先选择标注模式</p>
        <Link href="/annotate/mode">
          <button className="text-primary hover:underline">去选择模式 →</button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">提交成功！</h2>
        <p className="text-muted-foreground mb-2">
          审核通过后将获得积分奖励
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          感谢你的贡献，管理员审核通过后积分将自动到账
        </p>
        <Button onClick={loadTask} className="w-full max-w-xs">
          继续下一题（{getModeName(mode)}）
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {error ?? `「${getModeName(mode)}」暂无可用题目，请稍后再试或换其他模式`}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={loadTask}>重试</Button>
          <Link href="/annotate/mode">
            <Button variant="outline">换模式</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">标注任务 · {getModeName(mode)}</h1>
          <p className="text-sm text-muted-foreground">
            难度 {"★".repeat(task.difficulty)} · 图库：{task.mode_tags.map(getModeName).join(", ") || "通用"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/annotate/mode">
            <Button variant="ghost" size="sm">换模式</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadTask}>
            换一题
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">图片标注</CardTitle>
          </CardHeader>
          <CardContent>
            {task.imageUrl && (
              <BBoxCanvas
                imageUrl={task.imageUrl}
                bboxes={bboxes}
                onChange={setBboxes}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">思维链分析</CardTitle>
            </CardHeader>
            <CardContent>
              <ThoughtInput value={thought} onChange={setThought} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">位置猜测（可选）</CardTitle>
            </CardHeader>
            <CardContent>
              <MapPicker value={guessPos} onChange={setGuessPos} height="250px" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !thought.thought_text.trim()}
          className="px-8"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交中…
            </>
          ) : (
            "提交标注"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AnnotateContent />
    </Suspense>
  );
}
