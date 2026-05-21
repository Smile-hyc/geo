"use client";

import { Flame, Medal, Trophy, Activity } from "lucide-react";
import {
  getMockModeHeat,
  getMockUserHighScore,
  getMockTotalBattles,
  getMockTop5Leaderboard,
} from "@/features/battle/mockStats";
import { getBattleModeLabel } from "@/features/battle/config";

interface BattleStatsSidebarProps {
  mode: string;
  timeLimitSec: number;
  refreshKey: number;
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = 4;
  const w = 120;
  const h = 36;
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2);
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-9 w-[120px] shrink-0 text-primary"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  );
}

export default function BattleStatsSidebar({
  mode,
  timeLimitSec,
  refreshKey,
}: BattleStatsSidebarProps) {
  const heat = getMockModeHeat(mode, refreshKey);
  const highScore = getMockUserHighScore(mode, refreshKey);
  const totals = getMockTotalBattles(mode, refreshKey);
  const top5 = getMockTop5Leaderboard(mode, timeLimitSec, refreshKey);
  const modeLabel = getBattleModeLabel(mode);

  return (
    <section className="flex w-full flex-none flex-col gap-4 lg:w-[272px] lg:shrink-0">
      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          当前模式竞技热度
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-black tabular-nums text-slate-900">
            {heat.count7d.toLocaleString()}
          </p>
          <Sparkline points={heat.sparklinePoints} />
        </div>
        <p className="mt-1 text-[10px] text-slate-400">近 7 日对战场次（演示）</p>
      </div>

      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          你的历史最高积分
        </div>
        <p className="text-xl font-black tabular-nums text-slate-900">
          {highScore.points.toLocaleString()}{" "}
          <span className="text-sm font-bold text-slate-500">pts</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          {highScore.modeLabel} · {highScore.achievedAt}
        </p>
      </div>

      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Activity className="h-3.5 w-3.5 text-primary" />
          当前模式全服对战总局数
        </div>
        <p className="text-xl font-black tabular-nums leading-tight text-slate-900">
          {totals.total.toLocaleString()}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">数据截至 {totals.asOfDate}（演示）</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Medal className="h-3.5 w-3.5 text-sky-500" />
            排行榜 Top 5
          </div>
        </div>
        <p className="mb-3 text-[10px] font-semibold text-slate-500">
          {modeLabel} · {timeLimitSec}s
        </p>
        <ul className="space-y-2.5">
          {top5.map((row) => (
            <li
              key={row.rank}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-50 bg-slate-50/50 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-5 tabular-nums">#{row.rank}</span>
                <span className="truncate text-slate-800">{row.username}</span>
              </span>
              <span className="shrink-0 text-xs font-black tabular-nums text-slate-900">
                {row.points.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[10px] font-medium text-slate-400">
          查看完整排行榜
        </p>
      </div>
    </section>
  );
}
