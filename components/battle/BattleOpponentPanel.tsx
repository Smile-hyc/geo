"use client";

import Image from "next/image";
import { Loader2, Rocket, Zap, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INFERENCE_MODELS,
  getModelTags,
  type InferenceModelId,
} from "@/features/battle/config";
import { getDisplayMockWinRate } from "@/features/battle/mockStats";
import BattleConfigOverview from "@/components/battle/BattleConfigOverview";

interface BattleOpponentPanelProps {
  mode: string;
  timeLimitSec: number;
  rounds: number;
  aiModelId: InferenceModelId;
  onSelectModel: (id: InferenceModelId) => void;
  loading: boolean;
  error: string | null;
  onStart: () => void;
  refreshKey: number;
}

export default function BattleOpponentPanel({
  mode,
  timeLimitSec,
  rounds,
  aiModelId,
  onSelectModel,
  loading,
  error,
  onStart,
  refreshKey,
}: BattleOpponentPanelProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[28px] border border-slate-100 bg-white/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">选择对手 / 基准模型</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            胜率与榜单数据为演示占位，后续将接入真实统计。
          </p>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 flex items-center rounded-[14px] border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600"
          role="alert"
        >
          <Zap className="mr-2 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Desktop / tablet table */}
      <div className="hidden min-h-0 md:block">
        <div className="overflow-x-auto rounded-[16px] border border-slate-100">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">模型</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">胜率（近 30 天）</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {INFERENCE_MODELS.map((m) => {
                const selected = aiModelId === m.id;
                const rate = getDisplayMockWinRate(m.id, refreshKey);
                const tags = getModelTags(m.id);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-b border-slate-50 transition-colors last:border-0",
                      selected ? "bg-primary/[0.04]" : "hover:bg-slate-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                          <Image
                            src={m.image}
                            alt={m.label}
                            width={44}
                            height={44}
                            className="object-cover"
                          />
                        </div>
                        <span className="font-bold text-slate-900">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[140px] items-center gap-3">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-primary/80 transition-[width]"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 tabular-nums text-xs font-bold text-slate-800">
                          {rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {selected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          已选
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full font-bold"
                          disabled={loading}
                          onClick={() => onSelectModel(m.id)}
                        >
                          选择
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {INFERENCE_MODELS.map((m) => {
          const selected = aiModelId === m.id;
          const rate = getDisplayMockWinRate(m.id, refreshKey);
          const tags = getModelTags(m.id);
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-[18px] border-2 p-4 transition-colors",
                selected ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50/40"
              )}
            >
              <div className="flex gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                  <Image src={m.image} alt={m.label} width={48} height={48} className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{m.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary/80" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-slate-800">{rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {selected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    已选
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full font-bold"
                    disabled={loading}
                    onClick={() => onSelectModel(m.id)}
                  >
                    选择
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400 md:text-left">
        胜率基于当前模式下近 30 天对战数据的演示统计，仅供参考。
      </p>

      <div className="mt-6 space-y-4">
        <BattleConfigOverview
          mode={mode}
          timeLimitSec={timeLimitSec}
          rounds={rounds}
          opponentModelId={aiModelId}
        />

        <Button
          type="button"
          className="h-[56px] w-full rounded-[22px] text-[17px] font-bold shadow-[0_12px_30px_-10px_rgba(22,93,255,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0 lg:h-[62px] lg:text-[19px]"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span className="tracking-wide">引擎就绪...</span>
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-6 w-6" />
              <span className="tracking-wide">开始对战 Enter</span>
            </>
          )}
        </Button>

        <p className="text-center text-[9px] text-slate-400 sm:hidden">Enter 开始 · D 随机 · R 刷新</p>
        <p className="hidden text-center text-[10px] text-slate-400 sm:block">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
          {" 开始 · "}
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">D</kbd>
          {" 随机对手 · "}
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">R</kbd>
          {" 刷新数据"}
        </p>
      </div>
    </section>
  );
}
