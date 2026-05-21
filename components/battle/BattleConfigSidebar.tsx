"use client";

import { MapPin, Route, Mountain, Briefcase, Target, Timer, Trophy, CheckCircle2 } from "lucide-react";
import {
  BATTLE_MODES,
  ROUND_OPTIONS,
  TIME_OPTIONS,
} from "@/features/battle/config";

interface BattleConfigSidebarProps {
  mode: (typeof BATTLE_MODES)[number]["id"];
  onModeChange: (id: (typeof BATTLE_MODES)[number]["id"]) => void;
  timeLimit: (typeof TIME_OPTIONS)[number];
  onTimeLimitChange: (v: (typeof TIME_OPTIONS)[number]) => void;
  rounds: (typeof ROUND_OPTIONS)[number];
  onRoundsChange: (v: (typeof ROUND_OPTIONS)[number]) => void;
  disabled?: boolean;
}

export default function BattleConfigSidebar({
  mode,
  onModeChange,
  timeLimit,
  onTimeLimitChange,
  rounds,
  onRoundsChange,
  disabled,
}: BattleConfigSidebarProps) {
  return (
    <section className="flex w-full flex-none flex-col rounded-[28px] border border-slate-100 bg-white/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)] lg:w-[300px] lg:shrink-0">
      <header className="mb-4 flex items-center gap-3 px-0.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">对战配置</h2>
          <p className="text-[11px] text-slate-500">地理定位模式与规则</p>
        </div>
      </header>

      <div className="mb-5">
        <p className="mb-2.5 flex items-center gap-2 text-[12px] font-bold text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          地理定位模式
        </p>
        <div className="flex max-h-[min(40vh,280px)] flex-col gap-2.5 overflow-y-auto pr-0.5">
          {BATTLE_MODES.map((battleMode) => {
            const isSelected = mode === battleMode.id;
            let ModeIcon;
            switch (battleMode.id) {
              case "general":
                ModeIcon = MapPin;
                break;
              case "street_view":
                ModeIcon = Route;
                break;
              case "remote_sensing":
                ModeIcon = Briefcase;
                break;
              case "terrain":
                ModeIcon = Mountain;
                break;
              default:
                ModeIcon = Target;
            }

            return (
              <button
                key={battleMode.id}
                type="button"
                disabled={disabled}
                onClick={() => onModeChange(battleMode.id)}
                className={`group relative flex w-full flex-col gap-1 overflow-hidden rounded-[16px] border-2 p-3 text-left transition-all duration-300 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:shadow-md"
                }`}
              >
                <div className="flex w-full items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-white text-slate-500 ring-1 ring-slate-100 group-hover:text-primary"
                    }`}
                  >
                    <ModeIcon size={20} />
                  </div>
                  <p
                    className={`min-w-0 flex-1 truncate text-[14px] font-bold ${
                      isSelected ? "text-primary" : "text-slate-800"
                    }`}
                  >
                    {battleMode.label}
                  </p>
                  {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </div>
                <p className="line-clamp-2 pl-[52px] text-[11px] leading-relaxed text-slate-500">
                  {battleMode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold text-slate-700">
          <Timer className="h-3.5 w-3.5 text-primary" />
          单题时间限制
        </p>
        <div className="grid grid-cols-4 gap-1.5 rounded-[14px] bg-slate-100/80 p-1">
          {TIME_OPTIONS.map((t) => {
            const sel = timeLimit === t;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => onTimeLimitChange(t)}
                className={`rounded-[10px] py-2 text-center text-[11px] font-bold transition-all sm:text-xs ${
                  sel
                    ? "bg-white text-primary shadow-sm ring-2 ring-primary/30"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {t}s
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold text-slate-700">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          决胜局数
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ROUND_OPTIONS.map((r) => {
            const isSelected = rounds === r;
            return (
              <button
                key={r}
                type="button"
                disabled={disabled}
                onClick={() => onRoundsChange(r)}
                className={`relative overflow-hidden rounded-[14px] border-2 py-3 text-center text-[14px] font-bold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm text-primary"
                    : "border-slate-100 bg-white text-slate-800 hover:border-slate-200"
                }`}
              >
                {r} 回合
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
