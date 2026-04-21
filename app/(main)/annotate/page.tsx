"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Settings2, 
  SendHorizontal,
  Target,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BBoxCanvas, { type BBox } from "@/components/annotation/BBoxCanvas";
import ThoughtInput, { type ThoughtData } from "@/components/annotation/ThoughtInput";
import LocationMap from "@/components/map/LocationMap";
import { getNextTask, getTempFileURL, submitAnnotation } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { getAnnotationTypeName, getModeName } from "@/lib/modes";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
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
  const [submitted, setSubmitted] = useState(false);

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
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 rounded-[2rem] border-4 border-sky-100 border-t-primary mb-6"
        />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">正在检索全球地理数据节点...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[600px] text-center px-6"
      >
        <div className="mb-8 w-24 h-24 rounded-[2.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-100 border-4 border-white">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">标注提交成功</h2>
        <p className="max-w-md text-slate-500 font-medium leading-relaxed mb-10">
          您的贡献已记录。标注结果已同步至云端，相应积分将在专家审核完成后发放。
        </p>
        <div className="flex gap-4">
          <Button onClick={loadTask} size="lg" className="rounded-full px-8 h-14 text-base">
            继续下一题 <RefreshCw className="ml-2 h-5 w-5" />
          </Button>
          <Link href="/app/home">
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base">
              返回首页
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (!task || !mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-6">
        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <p className="text-xl font-bold text-slate-700 mb-8">{error ?? "未识别到有效的标注配置。"}</p>
        <Link href="/app/annotate/mode">
          <Button className="rounded-full px-10 h-14">重新配置模式</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <Layers size={14} />
            任务编号: {task.id}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {getModeName(mode)} <span className="text-primary">· {getAnnotationTypeName(annotationType)}</span>
          </h1>
          <div className="mt-4 flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">难度</span>
                <span className="text-xs font-black text-slate-700">{task.difficulty}</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {task.mode_tags.map(tag => (
                   <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md uppercase">#{tag}</span>
                ))}
             </div>
          </div>
        </div>

        <div className="flex gap-3">
           <Link href="/app/annotate/mode">
              <Button variant="outline" size="sm" className="rounded-full px-4 h-10 border-slate-200">
                <Settings2 size={16} className="mr-2 text-slate-400" /> 修改配置
              </Button>
           </Link>
           <Button variant="outline" size="sm" onClick={loadTask} className="rounded-full px-4 h-10 border-slate-200">
              <RefreshCw size={16} className="mr-2 text-slate-400" /> 换一题
           </Button>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Main Canvas Area */}
        <div className="lg:col-span-7 space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900">
              <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
                 <h3 className="text-xs font-black text-white/40 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Target className="text-primary" size={16} />
                    地理元素识别引擎
                 </h3>
                 <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Live Engine</span>
                 </div>
              </div>
              <div className="p-4 bg-slate-800/50">
                 {task.imageUrl && (
                   <BBoxCanvas 
                     imageUrl={task.imageUrl} 
                     bboxes={bboxes} 
                     onChange={setBboxes} 
                   />
                 )}
              </div>
           </Card>

           <div className="grid gap-6 sm:grid-cols-2">
              <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-indigo-600 text-white relative overflow-hidden group">
                 <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <ShieldCheck size={40} className="mb-4 text-indigo-200" />
                 <h3 className="text-xl font-black mb-2 tracking-tight">品质保障</h3>
                 <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                    您的标注将进入多重校验流程。保持高精度的标注记录将获得额外的“卓越贡献者”勋章与积分加成。
                 </p>
              </Card>
              <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-sky-600 text-white relative overflow-hidden group">
                 <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <Sparkles size={40} className="mb-4 text-sky-200" />
                 <h3 className="text-xl font-black mb-2 tracking-tight">积分回馈</h3>
                 <p className="text-xs text-sky-100 leading-relaxed font-medium">
                    当前任务成功提交后，系统将即时锁定预支积分。每日完成 20 组有效标注可激活“连胜奖励”。
                 </p>
              </Card>
           </div>
        </div>

        {/* Info & Inputs Area */}
        <div className="lg:col-span-5 space-y-8">
           {needsReasoning && (
             <Card className="border-none shadow-xl rounded-[2.5rem] p-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                   思维链推理
                </h3>
                <ThoughtInput value={thought} onChange={setThought} />
             </Card>
           )}

           {task.lat != null && (
             <Card className="border-none shadow-xl rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     坐标元数据
                  </h3>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                     已加密验证
                  </span>
                </div>
                <LocationMap
                  lat={task.lat}
                  lng={task.lng!}
                  description={task.true_location ?? "当前地理任务的绝对位置参考。"}
                />
             </Card>
           )}

           <Card className="border-none shadow-2xl rounded-[3rem] p-10 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="relative z-10">
                 <h3 className="text-2xl font-black tracking-tight mb-2">准备好同步了吗？</h3>
                 <p className="text-xs font-medium text-slate-400 mb-8 leading-relaxed">
                    请在提交前仔细检查标注框的完整性与思维链的逻辑严密性。
                 </p>

                 {error && (
                   <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm font-bold flex items-center gap-2">
                      <Zap size={18} />
                      {error}
                   </div>
                 )}

                 <Button 
                    size="lg" 
                    className="w-full h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/30 group"
                    onClick={handleSubmit} 
                    disabled={submitting} 
                 >
                    {submitting ? (
                       <Loader2 size={24} className="animate-spin" />
                    ) : (
                       <>
                          同步标注结果
                          <SendHorizontal size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
                       </>
                    )}
                 </Button>

                 <div className="flex items-center justify-between mt-6 px-4">
                    <button 
                       onClick={() => router.push("/app/home")}
                       className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                    >
                       放弃任务
                    </button>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocol 4.0</span>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <AnnotateContent />
    </Suspense>
  );
}
