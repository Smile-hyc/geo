"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>思维链分析</Label>
        <Textarea
          placeholder="描述你的推理过程：观察到哪些地理特征？（植被、建筑风格、道路标识、气候特征等）如何缩小范围？"
          value={value.thought_text}
          onChange={(e) => update("thought_text", e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          详细的思维链分析可获得更高质量评分和额外积分奖励
        </p>
      </div>

      <div className="space-y-2">
        <Label>最终答案（地点）</Label>
        <Input
          placeholder="例如：中国云南省大理市"
          value={value.final_answer}
          onChange={(e) => update("final_answer", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>置信度</Label>
          <span className="text-sm font-medium text-primary">{value.confidence}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">不确定</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value.confidence}
            onChange={(e) => update("confidence", parseInt(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground">确定</span>
        </div>
        <ConfidenceLabel confidence={value.confidence} />
      </div>
    </div>
  );
}

function ConfidenceLabel({ confidence }: { confidence: number }) {
  const labels: Array<{ threshold: number; label: string; color: string }> = [
    { threshold: 20, label: "非常不确定", color: "text-red-400" },
    { threshold: 40, label: "不太确定", color: "text-orange-400" },
    { threshold: 60, label: "较为确定", color: "text-yellow-400" },
    { threshold: 80, label: "比较确定", color: "text-lime-400" },
    { threshold: 100, label: "非常确定", color: "text-green-400" },
  ];
  const match = labels.find((l) => confidence <= l.threshold) ?? labels[labels.length - 1];
  return (
    <p className={`text-xs ${match.color}`}>{match.label}</p>
  );
}
