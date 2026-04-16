"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Settings2, 
  SendHorizontal,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BBoxCanvas, { type BBox } from "@/components/annotation/BBoxCanvas";
import ThoughtInput, { type ThoughtData } from "@/components/annotation/ThoughtInput";
import LocationMap from "@/components/map/LocationMap";
import { getNextTask, getTempFileURL, submitAnnotation } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { getAnnotationTypeName, getModeName } from "@/lib/modes";

const primaryButtonStyle =
  "rounded-md border border-[#4c775c] bg-[rgba(36,87,52,0.9)] px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99] inline-flex items-center gap-2 disabled:opacity-50";
const secondaryButtonStyle =
  "rounded-md border border-[#3d624b] bg-[rgba(18,36,26,0.86)] px-8 py-3 text-sm font-semibold text-[#deefe4] transition hover:border-[#5a886c] active:scale-[0.99] inline-flex items-center gap-2";

interface Task {
  id: number;
  storage_url: string;
  mode_tags: string[];
  difficulty: number;
  lat?: number | null;
  lng?: number | null;
  true_location?: string | null;
  imageUrl?: string;
}

const INIT_THOUGHT: ThoughtData = {
  thought_text: "",
  final_answer: "",
  confidence: 50,
};

function AnnotateContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const annotationType = searchParams.get("annotationType") ?? "hybrid";
  const user = useAuthStore((state) => state.user);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [thought, setThought] = useState<ThoughtData>(INIT_THOUGHT);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(true);

  const needsReasoning = annotationType === "reasoning" || annotationType === "hybrid";
  const needsBoxes = annotationType === "bbox" || annotationType === "hybrid";

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    setBboxes([]);
    setThought(INIT_THOUGHT);
    setSubmitted(false);

    try {
      const response = await getNextTask(mode ? { mode } : undefined);
      if (!response.task) {
        setTask(null);
        setError("当前所选模式暂无可用任务。");
        return;
      }

      let imageUrl = response.task.storage_url;
      if (imageUrl.startsWith("cloud://") || imageUrl.startsWith("cos://")) {
        const file = await getTempFileURL(imageUrl);
        imageUrl = file.tempFileURL;
      }

      setTask({ ...response.task, imageUrl });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载下一条任务失败。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [mode, annotationType]);

  const handleSubmit = async () => {
    if (!task || !mode) return;

    if (needsReasoning && thought.thought_text.trim().length < 20) {
      setError("思维链说明至少需要输入 20 个字符。");
      return;
    }

    if (needsBoxes && bboxes.length === 0) {
      setError("地理元素标注至少需要绘制一个框。");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitAnnotation({
        image_id: task.id,
        mode_type: mode,
        annotation_type: annotationType,
        thought_text: needsReasoning ? thought.thought_text : "",
        final_answer: needsReasoning ? thought.final_answer : "",
        confidence: needsReasoning ? thought.confidence : 50,
        cloudbase_uid: user?.uid,
        email: user?.email,
        bboxes: needsBoxes ? bboxes : [],
      });
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-transparent">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">正在检索地理数据...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-transparent px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-md border border-[#4b7c60] bg-[rgba(28,61,40,0.86)] text-green-300">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="mb-2 text-3xl font-extrabold text-slate-900">标注提交成功</h2>
        <p className="mb-10 max-w-md text-slate-500 font-medium">您的贡献已记录。标注结果已同步至云端，相应积分将在审核完成后发放。</p>
        <div className="flex gap-4">
          <button onClick={loadTask} className={primaryButtonStyle}>
            继续下一题 <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/app/home" className={secondaryButtonStyle}>返回首页</Link>
        </div>
      </div>
    );
  }

  if (!task || !mode) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-rose-500 opacity-50" />
        <p className="mb-6 font-bold text-slate-700">{error ?? "未识别到有效的标注配置。"}</p>
        <Link href="/app/annotate/mode" className={primaryButtonStyle}>重新配置模式</Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-transparent flex flex-col">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 py-6 md:px-12 lg:px-16 overflow-hidden">
        
        {/* Header */}
        <header className="mb-6 flex items-end justify-between shrink-0">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
              Active Task / ID: {task.id}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              {getModeName(mode)} <span className="text-blue-600 ml-1">· {getAnnotationTypeName(annotationType)}</span>
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100 uppercase">
                难度系数 {task.difficulty}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Tags: {task.mode_tags.join(", ") || "General"}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link href="/app/annotate/mode" className={secondaryButtonStyle + " px-4 py-2 text-[11px]"}>
              <Settings2 className="h-3.5 w-3.5 text-blue-500" /> 修改配置
            </Link>
            <button onClick={loadTask} className={secondaryButtonStyle + " px-4 py-2 text-[11px]"}>
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" /> 换一题
            </button>
          </div>
        </header>

        {/* 主工作区 */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-12 pb-4">
          
          {/* 左侧：画布区 - 修正了高度扩展逻辑 */}
          <section className="lg:col-span-7 overflow-y-auto pr-1 custom-scrollbar">
            <div className="wg-panel flex min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4 shrink-0">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                  <Target className="h-4 w-4 text-blue-600" />
                  地理元素识别
                </h3>
                <span className="text-[9px] font-mono text-slate-300 tracking-tighter">画布渲染引擎 V2</span>
              </div>
              
              {/* 这里去掉 flex-1，使用默认高度，让它随内容撑开 */}
              <div className="relative bg-[rgba(12,22,16,0.72)] p-4 shrink-0 overflow-hidden">
                {task.imageUrl && (
                  <BBoxCanvas 
                    imageUrl={task.imageUrl} 
                    bboxes={bboxes} 
                    onChange={setBboxes} 
                  />
                )}
              </div>

              {/* 标注列表展示区：确保这部分内容也在白色容器内，且能撑开容器 */}
              <div className="flex-1 bg-white rounded-b-[32px]">
                {/* 这里的 BBoxCanvas 内部逻辑会自动渲染标注列表 */}
                {/* 确保 BBoxCanvas 内部的标注列表没有设置绝对定位，否则会脱离文档流导致背景不跟随 */}
              </div>
            </div>
          </section>

          {/* 右侧：推理与信息区 */}
          <section className="lg:col-span-5 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {needsReasoning && (
                <div className="wg-panel p-6">
                  <h3 className="mb-4 text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    思维链记录
                  </h3>
                  <ThoughtInput value={thought} onChange={setThought} />
                </div>
              )}

              {task.lat != null && (
                <div className="wg-panel p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      元数据参考
                    </h3>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      真实坐标
                    </span>
                  </div>
                  <LocationMap
                    lat={task.lat}
                    lng={task.lng!}
                    description={task.true_location ?? "当前任务的位置元数据。"}
                  />
                </div>
              )}

              {/* 提交区域 */}
              <div className="wg-panel border-[#3e694f] p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">准备就绪？</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    请确保标注框与推理说明逻辑严密。完成后点击下方按钮同步。
                  </p>
                </div>
                
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting} 
                    className={primaryButtonStyle + " w-full justify-center py-4 text-base"}
                  >
                    {submitting ? "正在同步云端..." : "提交标注任务"}
                    <SendHorizontal className={`h-5 w-5 ml-1 ${submitting ? 'animate-pulse' : ''}`} />
                  </button>
                  
                  <div className="flex items-center justify-between px-2">
                    <Link 
                      href="/app/home" 
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      放弃当前任务
                    </Link>
                    <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">平台版本 1.0</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between border-t border-slate-100 py-4 shrink-0">
          <Link href="/app/annotate/mode" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回配置页
          </Link>
          <div className="h-px flex-1 mx-8 bg-[#2c4a39]" />
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            精准数据采集
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <AnnotateContent />
    </Suspense>
  );
}
