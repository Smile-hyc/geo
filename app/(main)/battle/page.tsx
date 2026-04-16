"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Shield, Timer, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBattle } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import {
  AI_OPPONENTS,
  BATTLE_MODES,
  ROUND_OPTIONS,
  TIME_OPTIONS,
  getAiOpponentLabel,
  getBattleModeLabel,
} from "@/features/battle/config";

export default function BattleConfigPage() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof BATTLE_MODES)[number]["id"]>(BATTLE_MODES[0].id);
  const [timeLimit, setTimeLimit] = useState<(typeof TIME_OPTIONS)[number]>(TIME_OPTIONS[1]);
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]>(ROUND_OPTIONS[1]);
  const [aiOpponent, setAiOpponent] = useState<(typeof AI_OPPONENTS)[number]["id"]>(AI_OPPONENTS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    const currentUser = useAuthStore.getState().user;
    const uid = currentUser?.uid ?? "";
    const email = currentUser?.email ?? "";

    if (!uid && !email) {
      setError("请先登录。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { session_id } = await createBattle({
        mode_type: mode,
        time_limit_sec: timeLimit,
        round_count: rounds,
        ai_model_id: aiOpponent,
        cloudbase_uid: uid,
        email,
      });
      router.push(`/app/battle/${session_id}/play`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "开始对战失败。");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-78px)] py-4">
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="wg-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">对战设置</p>
          <h1 className="mt-3 font-['Jockey_One'] text-5xl leading-[0.9] text-[#f2fff5]">
            AI 竞技场
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#c2d8c9]">
            选择模式后发起完整对战。
          </p>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#d8eee0]">
            模式
          </h2>
          <div className="mt-2 grid gap-2">
            {BATTLE_MODES.map((battleMode) => (
              <button
                key={battleMode.id}
                onClick={() => setMode(battleMode.id)}
                className={[
                  "rounded-md border p-3 text-left transition",
                  mode === battleMode.id
                    ? "border-[#5a8c6f] bg-[rgba(35,71,48,0.86)]"
                    : "border-[#335643] bg-[rgba(17,33,24,0.78)] hover:border-[#4b765d]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[#f4fff8]">{battleMode.label}</p>
                <p className="mt-1 text-xs text-[#bfd5c7]">{battleMode.description}</p>
              </button>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#d8eee0]">
            AI 对手
          </h2>
          <div className="mt-2 grid gap-2">
            {AI_OPPONENTS.map((opponent) => (
              <button
                key={opponent.id}
                onClick={() => setAiOpponent(opponent.id)}
                className={[
                  "rounded-md border p-3 text-left transition",
                  aiOpponent === opponent.id
                    ? "border-[#5a8c6f] bg-[rgba(35,71,48,0.86)]"
                    : "border-[#335643] bg-[rgba(17,33,24,0.78)] hover:border-[#4b765d]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[#f4fff8]">{opponent.label}</p>
                <p className="mt-1 text-xs text-[#bfd5c7]">{opponent.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="wg-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#afccb9]">对战参数</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SettingRow
              title="限时"
              icon={<Timer className="h-4 w-4 text-[#a9ceb8]" />}
              options={TIME_OPTIONS}
              value={timeLimit}
              onSelect={(value) => setTimeLimit(value as (typeof TIME_OPTIONS)[number])}
              renderValue={(value) => `${value}秒`}
            />
            <SettingRow
              title="回合数"
              icon={<Trophy className="h-4 w-4 text-[#a9ceb8]" />}
              options={ROUND_OPTIONS}
              value={rounds}
              onSelect={(value) => setRounds(value as (typeof ROUND_OPTIONS)[number])}
              renderValue={(value) => `${value}`}
            />
          </div>

          <div className="mt-5 rounded-md border border-[#355842] bg-[rgba(16,32,23,0.86)] p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-[#a9c6b3]">摘要</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <SummaryItem label="模式" value={getBattleModeLabel(mode)} />
              <SummaryItem label="AI 对手" value={getAiOpponentLabel(aiOpponent)} />
              <SummaryItem label="限时" value={`${timeLimit} 秒`} />
              <SummaryItem label="回合" value={`${rounds}`} />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="h-11 min-w-[160px] gap-2"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              开始对战
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={() => router.push("/app/home")}>
              <Shield className="h-4 w-4" />
              返回首页
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingRow<T extends number>({
  title,
  icon,
  options,
  value,
  onSelect,
  renderValue,
}: {
  title: string;
  icon: React.ReactNode;
  options: readonly T[];
  value: T;
  onSelect: (value: T) => void;
  renderValue: (value: T) => string;
}) {
  return (
    <div className="rounded-md border border-[#355842] bg-[rgba(16,32,23,0.86)] p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#b6d3c0]">
        {icon}
        {title}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={[
              "h-9 rounded-md border text-sm transition",
              value === option
                ? "border-[#5b8b6f] bg-[rgba(37,74,50,0.9)] text-white"
                : "border-[#2f4f3d] bg-[rgba(13,25,18,0.84)] text-[#cce0d2] hover:border-[#4b775f]",
            ].join(" ")}
          >
            {renderValue(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#2f4f3d] bg-[rgba(12,23,17,0.84)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#9db8a8]">{label}</p>
      <p className="mt-1 text-sm text-[#e6f6eb]">{value}</p>
    </div>
  );
}
