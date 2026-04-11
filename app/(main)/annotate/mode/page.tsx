"use client";

import Link from "next/link";
import { useState } from "react";
import { Layers, Map, MapPin, Mountain, Satellite, ArrowLeft } from "lucide-react";
import { ANNOTATION_MODES, ANNOTATION_TYPES, type AnnotationTypeId } from "@/lib/modes";

const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin className="h-5 w-5 text-blue-500" />,
  remote_sensing: <Satellite className="h-5 w-5 text-emerald-500" />,
  map_mode: <Map className="h-5 w-5 text-amber-500" />,
  terrain: <Mountain className="h-5 w-5 text-stone-500" />,
  mixed: <Layers className="h-5 w-5 text-violet-500" />,
};

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] = useState<AnnotationTypeId>("hybrid");

  return (
    <div className="h-screen w-full bg-slate-50/50 flex flex-col overflow-hidden text-slate-900">
      {/* py-5 替代 py-8，稍微提拉高度 */}
      <main className="mx-auto w-full max-w-[1600px] flex flex-col px-6 md:px-16 lg:px-20 py-5">
        
        {/* Header Section - 紧致化间距 mb-5 */}
        <header className="mb-5 shrink-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
            标注配置
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            选择模式与<span className="text-blue-600">标注流程。</span>
          </h1>
          <p className="mt-1.5 text-sm md:text-base leading-relaxed text-slate-500 max-w-3xl">
            需求文档要求明确区分流程。请在下方选择特定的工作流或进入混合采集。
          </p>
        </header>

        {/* 顶部三选一卡片 - p-4 替代 p-5, mb-5 替代 mb-8 */}
        <section className="grid gap-4 md:grid-cols-3 mb-5 shrink-0">
          {ANNOTATION_TYPES.map((type) => {
            const selected = annotationType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setAnnotationType(type.id)}
                className={`group relative rounded-[20px] border-2 p-4 text-left transition-all duration-300 ${
                  selected
                    ? "border-blue-600 bg-blue-50/50 shadow-md -translate-y-1"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className={`text-lg font-bold transition-colors ${selected ? "text-blue-700" : "text-slate-800"}`}>
                  {type.name}
                </p>
                <p className="mt-1 text-xs md:text-sm leading-snug text-slate-500">
                  {type.description}
                </p>
                {selected && (
                  <div className="absolute top-3 right-5 text-[9px] font-bold text-blue-600 tracking-tighter">
                    ACTIVE
                  </div>
                )}
              </button>
            );
          })}
        </section>

        {/* 底部卡片区域 - p-5 替代 p-7，gap-y-3 紧凑行间距 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 content-start items-start">
          {ANNOTATION_MODES.map((mode) => (
            <Link
              key={mode.id}
              href={`/app/annotate?mode=${encodeURIComponent(mode.id)}&annotationType=${encodeURIComponent(annotationType)}`}
              className="group relative flex flex-col rounded-[24px] border-2 border-slate-300 bg-white p-5 transition-all duration-300 hover:border-blue-500 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-blue-50 shrink-0">
                {MODE_ICONS[mode.id] ?? <MapPin className="h-5 w-5 text-slate-400" />}
              </div>

              <div className="min-h-0">
                <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                  {mode.name}
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-slate-500 font-medium line-clamp-2">
                  {mode.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-1 shrink-0">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">默认奖励</span>
                  <span className="font-bold text-slate-700">{mode.defaultReward} 积分</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">实时地图</span>
                  <span className="font-bold text-slate-700">{mode.showTruthLocation ? "已启用" : "已停用"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {ANNOTATION_TYPES.find((t) => t.id === annotationType)?.name}
                  </span>
                  <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                    开始任务 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Footer - py-3 替代 py-4 */}
        <footer className="shrink-0 flex justify-center py-3 border-t border-slate-100 mt-auto">
          <Link 
            href="/app/home" 
            className="flex items-center gap-2 text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回应用首页
          </Link>
        </footer>
      </main>
    </div>
  );
}