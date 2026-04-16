"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Brain, MapPin, Gauge, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThoughtData {
  thought_text: string;
  final_answer: string;
  confidence: number;
}

interface Props {
  value: ThoughtData;
  onChange: (data: ThoughtData) => void;
}

export default function ThoughtInput({ value, onChange }: Props) {
  const update = (field: keyof ThoughtData, val: string | number) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
           <Brain size={14} className="text-primary" />
           深度推理分析
        </Label>
        <div className="relative group">
           <Textarea
             placeholder="请描述您的推理链条：植被覆盖、建筑风格偏向、道路指示牌文字、太阳方位或地形特征等。优秀的推理将获得额外质量加成。"
             value={value.thought_text}
             onChange={(e) => update("thought_text", e.target.value)}
             rows={6}
             className="resize-none rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all p-4 text-sm leading-relaxed"
           />
           <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-300">
              已输入 {value.thought_text.length} 字符
           </div>
        </div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pl-1 uppercase tracking-tighter">
          <Info size={12} className="text-primary" />
          高质量的推理过程是提升 AI 模型性能的关键
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
           <MapPin size={14} className="text-primary" />
           最终判定地点
        </Label>
        <Input
          placeholder="例如：中国 云南省 大理市 双廊镇"
          value={value.final_answer}
          onChange={(e) => update("final_answer", e.target.value)}
          className="rounded-2xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
        />
      </div>

      <div className="space-y-4 pt-2 border-t border-slate-50">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
             <Gauge size={14} className="text-primary" />
             判定置信度
          </Label>
          <span className="text-lg font-black text-primary tabular-nums">{value.confidence}%</span>
        </div>
        <div className="px-2">
           <input
             type="range"
             min={0}
             max={100}
             step={5}
             value={value.confidence}
             onChange={(e) => update("confidence", parseInt(e.target.value))}
             className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-primary cursor-pointer"
           />
        </div>
        <div className="flex justify-between items-center px-1">
           <span className="text-[10px] font-black text-slate-300 uppercase">随机猜测</span>
           <ConfidenceLabel confidence={value.confidence} />
           <span className="text-[10px] font-black text-slate-300 uppercase">绝对确信</span>
        </div>
      </div>
    </div>
  );
}

function ConfidenceLabel({ confidence }: { confidence: number }) {
  const labels: Array<{ threshold: number; label: string; color: string; bgColor: string }> = [
    { threshold: 20, label: "盲猜模式", color: "text-rose-600", bgColor: "bg-rose-50" },
    { threshold: 40, label: "存在偏差", color: "text-orange-600", bgColor: "bg-orange-50" },
    { threshold: 60, label: "逻辑通顺", color: "text-amber-600", bgColor: "bg-amber-50" },
    { threshold: 80, label: "高度准确", color: "text-sky-600", bgColor: "bg-sky-50" },
    { threshold: 100, label: "精准定位", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];
  const match = labels.find((l) => confidence <= l.threshold) ?? labels[labels.length - 1];
  return (
    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors", match.color, match.bgColor)}>
       {match.label}
    </div>
  );
}
