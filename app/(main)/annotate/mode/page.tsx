"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Map, MapPin, Mountain, Satellite, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";

import { ANNOTATION_MODES, ANNOTATION_TYPES, type AnnotationTypeId } from "@/lib/modes";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODE_ICONS: Record<string, React.ReactNode> = {
  street_view: <MapPin size={20} />,
  remote_sensing: <Satellite size={20} />,
  map_mode: <Map size={20} />,
  terrain: <Mountain size={20} />,
  mixed: <Layers size={20} />,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function AnnotateModeSelectPage() {
  const [annotationType, setAnnotationType] = useState<AnnotationTypeId>("hybrid");

  return (
    <div className="py-8">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-4">选择标注模式</h1>
        <p className="text-slate-500">
          根据您的专长选择合适的标注类型与任务场景，精准的数据标注是构建 AI 的核心。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Settings */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-sky-500 fill-sky-500" size={20} />
                标注类型
              </CardTitle>
              <CardDescription>
                决定您将如何与地图元素交互
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {ANNOTATION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAnnotationType(type.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl transition-all border-2 text-left",
                    annotationType === type.id
                      ? "bg-sky-50 border-sky-500 shadow-md shadow-sky-100"
                      : "bg-white border-slate-50 hover:border-slate-200"
                  )}
                >
                  <span className={cn(
                    "font-bold text-sm mb-1",
                    annotationType === type.id ? "text-sky-700" : "text-slate-700"
                  )}>
                    {type.name}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {type.description}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Available Modes */}
        <div className="lg:col-span-8">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
          >
            {ANNOTATION_MODES.map((mode) => (
              <motion.div key={mode.id} variants={item}>
                <Link
                  href={`/app/annotate?mode=${encodeURIComponent(mode.id)}&annotationType=${encodeURIComponent(annotationType)}`}
                  className="group block h-full"
                >
                  <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group-hover:bg-gradient-to-br from-white to-sky-50">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-110">
                        {MODE_ICONS[mode.id] ?? <MapPin size={20} />}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mode.name}</CardTitle>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase">
                          +{mode.defaultReward} PTS
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {mode.description}
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-xs font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        立即进入任务
                        <ChevronRight size={14} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
