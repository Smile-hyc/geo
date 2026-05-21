"use client";

import { Loader2, Flame, Medal, Trophy, Activity } from "lucide-react";
import { getBattleModeLabel } from "@/features/battle/config";
import {
  findModeHighScore,
  formatHighScoreDate,
  type ModeHighScore,
  type ModeLeaderboardRow,
} from "@/features/battle/highScores";
import { type ModeBattleStats } from "@/features/battle/modeStats";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface BattleStatsSidebarProps {
  mode: string;
  modeHighScores: ModeHighScore[] | null;
  highScoresLoading: boolean;
  modeLeaderboard: ModeLeaderboardRow[] | null;
  leaderboardLoading: boolean;
  modeStats: ModeBattleStats | null;
  modeStatsLoading: boolean;
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
  modeHighScores,
  highScoresLoading,
  modeLeaderboard,
  leaderboardLoading,
  modeStats,
  modeStatsLoading,
}: BattleStatsSidebarProps) {
  const currentUser = useAuthStore((state) => state.user);
  const modeLabel = getBattleModeLabel(mode);
  const currentHigh = findModeHighScore(modeHighScores, mode);
  const top5 = modeLeaderboard ?? [];
  const sparklinePoints = modeStats?.daily_counts ?? [];

  return (
    <section className="flex w-full flex-none flex-col gap-4 lg:w-[272px] lg:shrink-0">
      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          当前模式竞技热度
        </div>
        {modeStatsLoading ? (
          <div className="flex items-center gap-2 py-1 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">加载中...</span>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2">
            <p className="text-2xl font-black tabular-nums text-slate-900">
              {(modeStats?.count_7d ?? 0).toLocaleString()}
            </p>
            {sparklinePoints.length >= 2 && <Sparkline points={sparklinePoints} />}
          </div>
        )}
      </div>

      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          你的历史最高积分
        </div>
        {highScoresLoading ? (
          <div className="flex items-center gap-2 py-1 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">加载中...</span>
          </div>
        ) : currentHigh ? (
          <>
            <p className="text-xl font-black tabular-nums text-slate-900">
              {currentHigh.best_score.toLocaleString()}{" "}
              <span className="text-sm font-bold text-slate-500">分</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {modeLabel} · {formatHighScoreDate(currentHigh.achieved_at)}
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-black tabular-nums text-slate-400">—</p>
            <p className="mt-1 text-[10px] text-slate-500">
              {modeLabel} · 暂无对战记录
            </p>
          </>
        )}
      </div>

      <div className="rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Activity className="h-3.5 w-3.5 text-primary" />
          当前模式全服对战总局数
        </div>
        {modeStatsLoading ? (
          <div className="flex items-center gap-2 py-1 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">加载中...</span>
          </div>
        ) : (
          <p className="text-xl font-black tabular-nums leading-tight text-slate-900">
            {(modeStats?.total_battles ?? 0).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-slate-100 bg-white/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Medal className="h-3.5 w-3.5 text-sky-500" />
            排行榜 Top 5
          </div>
        </div>
        <p className="mb-3 text-[10px] font-semibold text-slate-500">
          {modeLabel} · 历史最高分
        </p>
        {leaderboardLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">加载中...</span>
          </div>
        ) : top5.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">该模式暂无排行数据</p>
        ) : (
          <ul className="space-y-2.5">
            {top5.map((row) => {
              const isMe = row.username === currentUser?.username;
              return (
                <li
                  key={`${row.rank}-${row.username}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                    isMe
                      ? "border-primary/20 bg-primary/5"
                      : "border-slate-50 bg-slate-50/50"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-5 shrink-0 tabular-nums">#{row.rank}</span>
                    <span
                      className={cn(
                        "truncate",
                        isMe ? "text-primary" : "text-slate-800"
                      )}
                    >
                      {row.username}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-black tabular-nums text-slate-900">
                    {row.best_score.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
