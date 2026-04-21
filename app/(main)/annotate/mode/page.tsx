// 升级版UI界面

"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, Map, MapPin, Mountain, Satellite, 
  Zap, CheckCircle2, PenTool, Brain, Focus, Sparkles 
} from "lucide-react";
import { useState } from "react";

import { ANNOTATION_MODES, ANNOTATION_TYPES, type AnnotationTypeId } from "@/lib/modes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 右侧：常规小图标
const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin size={24} />,
  remote_sensing: <Satellite size={24} />,
  map_mode: <Map size={24} />,
  terrain: <Mountain size={24} />,
  mixed: <Layers size={24} />,
};

// ================= 新增：极简线条画（水印背景）=================
// 通过将 strokeWidth 设为极细，完美模拟手绘简笔画风格
const MODE_BG_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin size={160} strokeWidth={0.5} />,
  remote_sensing: <Satellite size={160} strokeWidth={0.5} />,
  map_mode: <Map size={160} strokeWidth={0.5} />,
  terrain: <Mountain size={160} strokeWidth={0.5} />,
  mixed: <Layers size={160} strokeWidth={0.5} />,
};

const getTypeIcon = (name: string, isBg = false) => {
  const size = isBg ? 140 : 20;
  const stroke = isBg ? 0.5 : 2;
  if (name.includes("思维")) return <Brain size={size} strokeWidth={stroke} />;
  if (name.includes("框") || name.includes("元素")) return <Focus size={size} strokeWidth={stroke} />;
  return <Sparkles size={size} strokeWidth={stroke} />; 
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] = useState<AnnotationTypeId>("hybrid");
  const [selectedMode, setSelectedMode] = useState<string>("street_view");

  return (
    // 修复1：去掉了 flex justify-center，改为 pt-8，自然贴顶，无需 translate 强行偏移
    <div className="min-h-screen bg-slate-50 pt-8 pb-36 relative overflow-hidden">
      
      {/* ================= 环境光晕背景 ================= */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-sky-200/50 rounded-full blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-blue-300/30 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* 核心内容区 */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6">
        
        {/* ================= Header ================= */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <PenTool size={26} className="fill-white/20" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              Geo Annotate
            </h1>
            <p className="text-sm font-bold text-slate-500">
              AI标注模式选择
            </p>
          </div>
        </div>

        {/* 修复2：为了突出主次，左边变窄 (col-span-4)，右边变宽 (col-span-8) */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ================= 左侧：标注类型 (紧凑/稍微缩小) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-500/30">
                1
              </div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">确定标注类型</h2>
            </div>

            <div className="flex flex-col gap-3">
              {ANNOTATION_TYPES.map((type) => {
                const isSelected = annotationType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setAnnotationType(type.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex flex-col items-start p-5 rounded-[1.2rem] transition-colors duration-300 border-2 text-left group overflow-hidden w-full h-full",
                      isSelected
                        ? "bg-white/80 backdrop-blur-xl border-sky-400 shadow-lg shadow-sky-200/40"
                        : "bg-white/40 backdrop-blur-md border-white/60 hover:bg-white/70 hover:border-sky-200"
                    )}
                  >
                    {/* 新增：极简水印背景 */}
                    <div className="absolute -bottom-6 -right-6 text-slate-900/[0.03] group-hover:text-sky-500/5 transition-colors duration-500 pointer-events-none">
                      {getTypeIcon(type.name, true)}
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-4 right-4 text-sky-500 z-10"
                        >
                          <CheckCircle2 size={20} className="fill-sky-50" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 shadow-sm",
                        isSelected ? "bg-sky-500 text-white shadow-sky-200" : "bg-white text-slate-400 group-hover:text-sky-500 group-hover:bg-sky-50"
                      )}>
                        {getTypeIcon(type.name, false)}
                      </div>
                      <span className={cn(
                        "font-black text-base transition-colors",
                        isSelected ? "text-sky-600" : "text-slate-700 group-hover:text-slate-900"
                      )}>
                        {type.name}
                      </span>
                    </div>

                    <span className="text-[13px] text-slate-500 leading-relaxed font-medium pr-8 relative z-10">
                      {type.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ================= 右侧：任务场景 (放大/极其突出) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-500/30">
                2
              </div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">选取任务场景 </h2>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5 grid-cols-1 sm:grid-cols-2">
              {ANNOTATION_MODES.map((mode, index) => {
                const isSelected = selectedMode === mode.id;
                const isLastOddItem = index === 4; 

                return (
                  <motion.div key={mode.id} variants={item} className={cn(isLastOddItem ? "sm:col-span-2" : "h-full")}>
                    <motion.button
                      onClick={() => setSelectedMode(mode.id)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative text-left rounded-[1.5rem] transition-colors duration-300 border-2 w-full h-full group overflow-hidden",
                        // 右侧内边距更大，彰显重要性
                        isLastOddItem ? "p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6" : "p-6 flex flex-col gap-4",
                        isSelected 
                          ? "bg-white/90 backdrop-blur-xl border-sky-400 shadow-xl shadow-sky-200/40 scale-[1.02]" 
                          : "bg-white/50 backdrop-blur-md border-white/60 hover:bg-white/80 hover:border-sky-200 hover:shadow-md"
                      )}
                    >
                      {/* 新增：极简水印背景 */}
                      <div className="absolute -bottom-8 -right-8 text-slate-900/[0.03] group-hover:text-sky-500/5 transition-colors duration-500 pointer-events-none">
                        {MODE_BG_ICONS[mode.id]}
                      </div>

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-5 right-5 text-sky-500 z-10"
                          >
                            <CheckCircle2 size={24} className="fill-sky-50" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                          isSelected 
                            ? "bg-gradient-to-tr from-sky-500 to-blue-400 text-white shadow-lg shadow-sky-300/50" 
                            : "bg-white/80 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 shadow-sm"
                        )}>
                          {MODE_ICONS[mode.id]}
                        </div>
                        <div className={isLastOddItem ? "flex-1" : ""}>
                          <h3 className={cn(
                            "text-xl font-black tracking-tight",
                            isSelected ? "text-slate-900" : "text-slate-700"
                          )}>
                            {mode.name}
                          </h3>
                          <div className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-md bg-amber-500/10 text-amber-600 text-[11px] font-black uppercase backdrop-blur-md">
                            +{mode.defaultReward} PTS
                          </div>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-[14px] text-slate-500 font-medium leading-relaxed relative z-10",
                        isLastOddItem ? "sm:mt-0 sm:flex-1" : "mt-2"
                      )}>
                        {mode.description}
                      </p>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ================= 底部：悬浮操作栏 ================= */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[950px] z-50 px-6">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="bg-white/50 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_rgba(0,100,200,0.1)] rounded-full p-3 pl-10 flex items-center justify-between"
        >
          <div className="flex gap-12">
            <div>
              <p className="text-[11px] font-bold text-slate-500/80 uppercase tracking-widest mb-1">1. 标注类型</p>
              <p className="text-base font-black text-slate-800">{ANNOTATION_TYPES.find(t => t.id === annotationType)?.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500/80 uppercase tracking-widest mb-1">2. 任务场景</p>
              <p className="text-base font-black text-slate-800">{ANNOTATION_MODES.find(m => m.id === selectedMode)?.name}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/app/home">
              <Button variant="ghost" className="rounded-full h-12 px-8 text-base font-bold text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors">
                取消
              </Button>
            </Link>
            <Link href={`/app/annotate?mode=${encodeURIComponent(selectedMode)}&annotationType=${encodeURIComponent(annotationType)}`}>
              <Button className="rounded-full h-12 px-10 text-base font-black bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95">
                <Zap className="mr-2 fill-white/80" size={18} /> 开始标注
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}