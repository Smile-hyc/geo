"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Shield, Timer, Trophy, Zap, Swords, Target, Cpu, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { createBattle } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";
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
    <div className="py-8 max-w-6xl mx-auto space-y-10">
      <section className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <Swords size={14} />
            实时对抗演练
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">AI 竞技场</h1>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            在快节奏的多轮竞技中挑战先进的 AI 模型。通过不断的博弈，提升您的地理标注精度与速度。
          </p>
        </motion.div>
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="text-primary" size={20} />
                选择对战模式
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {BATTLE_MODES.map((battleMode) => (
                <button
                  key={battleMode.id}
                  onClick={() => setMode(battleMode.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl transition-all border-2 text-left",
                    mode === battleMode.id
                      ? "bg-primary/5 border-primary shadow-md shadow-primary/5"
                      : "bg-white border-slate-50 hover:border-slate-200"
                  )}
                >
                  <span className={cn(
                    "font-bold text-sm mb-1",
                    mode === battleMode.id ? "text-primary" : "text-slate-700"
                  )}>
                    {battleMode.label}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {battleMode.description}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="text-indigo-500" size={20} />
                选择 AI 对手
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {AI_OPPONENTS.map((opponent) => (
                <button
                  key={opponent.id}
                  onClick={() => setAiOpponent(opponent.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl transition-all border-2 text-left",
                    aiOpponent === opponent.id
                      ? "bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100"
                      : "bg-white border-slate-50 hover:border-slate-200"
                  )}
                >
                  <span className={cn(
                    "font-bold text-sm mb-1",
                    aiOpponent === opponent.id ? "text-indigo-700" : "text-slate-700"
                  )}>
                    {opponent.label}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {opponent.description}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Parameters & Summary */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <SettingCard
              title="每轮时限"
              icon={<Timer className="text-sky-500" size={20} />}
              options={TIME_OPTIONS}
              value={timeLimit}
              onSelect={(value) => setTimeLimit(value as (typeof TIME_OPTIONS)[number])}
              renderValue={(value) => `${value}s`}
            />
            <SettingCard
              title="总回合数"
              icon={<Trophy className="text-amber-500" size={20} />}
              options={ROUND_OPTIONS}
              value={rounds}
              onSelect={(value) => setRounds(value as (typeof ROUND_OPTIONS)[number])}
              renderValue={(value) => `${value} Rnds`}
            />
          </div>

          <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Rocket className="text-primary" size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold">对战摘要</h3>
                     <p className="text-slate-400 text-sm">即将开启竞技征程</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                  <SummaryStat label="竞技模式" value={getBattleModeLabel(mode)} />
                  <SummaryStat label="对抗级别" value={getAiOpponentLabel(aiOpponent)} />
                  <SummaryStat label="每轮时限" value={`${timeLimit} 秒`} />
                  <SummaryStat label="战斗回合" value={`${rounds} 回合`} />
               </div>

               {error && (
                 <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm font-bold flex items-center gap-2">
                    <Zap size={18} />
                    {error}
                 </div>
               )}

               <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20 group"
                    onClick={handleStart}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        发起挑战
                        <ChevronRight className="ml-2 transition-transform group-hover:translate-x-1" size={20} />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-16 rounded-[2rem] text-lg font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
                    onClick={() => router.push("/app/home")}
                  >
                    取消并返回
                  </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingCard<T extends number>({
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
    <Card className="border-none shadow-lg rounded-[2.5rem]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={cn(
                "h-12 rounded-xl text-sm font-bold transition-all",
                value === option
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              {renderValue(option)}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-lg font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}
