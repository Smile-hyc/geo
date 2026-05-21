"use client";

import { MapPin, Timer, Trophy, Cpu } from "lucide-react";
import {
  getBattleModeLabel,
  getInferenceModelLabel,
} from "@/features/battle/config";

interface BattleConfigOverviewProps {
  mode: string;
  timeLimitSec: number;
  rounds: number;
  opponentModelId: string;
}

export default function BattleConfigOverview({
  mode,
  timeLimitSec,
  rounds,
  opponentModelId,
}: BattleConfigOverviewProps) {
  const items = [
    {
      icon: MapPin,
      label: "模式",
      value: getBattleModeLabel(mode),
    },
    {
      icon: Timer,
      label: "限时",
      value: `${timeLimitSec} 秒`,
    },
    {
      icon: Trophy,
      label: "回合",
      value: `${rounds} 回合`,
    },
    {
      icon: Cpu,
      label: "对手",
      value: getInferenceModelLabel(opponentModelId),
    },
  ] as const;

  return (
    <div className="rounded-[20px] border-2 border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4">
      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-left">
        当前配置概览
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-white/90 px-2 py-2 shadow-sm ring-1 ring-slate-100/80 sm:flex-row sm:items-center sm:gap-2 sm:px-3"
          >
            <div className="flex shrink-0 items-center gap-1.5 text-slate-500">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-[10px] font-semibold sm:text-[11px]">{label}</span>
            </div>
            <p className="truncate text-[11px] font-bold text-slate-900 sm:text-xs" title={value}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
