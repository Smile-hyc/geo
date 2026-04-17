"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; 
import { Loader2, BrainCircuit, FlaskConical, Rocket, Timer, Trophy, Zap, Swords, Target, Cpu, CheckCircle2, Shield } from "lucide-react";
import { MapPin, Route, Mountain, Briefcase } from "lucide-react";
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, 
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

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
      setError("登录状态尚未就绪，请刷新后重试。");
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
      setError(reason instanceof Error ? reason.message : "创建对战失败。");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full from-slate-50 to-slate-100 p-4 flex flex-col font-sans overflow-hidden items-center justify-center">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[1200px] h-full flex flex-col rounded-[40px] overflow-hidden relative shadow-[0_16px_60px_rgba(0,0,0,0.05)] border border-slate-100"
      >
        
        {/* --- 1. 头部区域 --- */}
        <header className="shrink-0 pt-8 px-8 z-1 flex items-center justify-between">
          {error && (
            <div className="text-sm text-rose-500 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-[32px] flex items-center animate-pulse font-medium">
              <Zap className="w-4 h-4 mr-1.5" />
              {error}
            </div>
          )}
        </header>

        {/* --- 2. 主体选择区 --- */}
        <main className="flex-1 p-8 lg:p-10 min-h-0 z-10 flex flex-col">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6"
          >
            
            {/* 左侧小栏：选取战场 */}
            <motion.div variants={item} className="flex flex-col relative h-full rounded-[32px]">
              <div className="flex items-center gap-5 mb-5 shrink-0 px-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-[18px] font-bold text-slate-900">选取战场</h2>
              </div>
              
              <div className="flex flex-col gap-3.5 z-10 flex-1 overflow-y-auto pb-4 pr-1">
                {BATTLE_MODES.map((battleMode) => {
                  const isSelected = mode === battleMode.id;
                  let ModeIcon;
                  switch (battleMode.id) {
                    case 'general': ModeIcon = MapPin; break;
                    case 'street_view': ModeIcon = Route; break;
                    case 'remote_sensing': ModeIcon = Briefcase; break;
                    case 'terrain': ModeIcon = Mountain; break;
                    default: ModeIcon = Target;
                  }

                  return (
                    <button
                      key={battleMode.id}
                      onClick={() => setMode(battleMode.id)}
                      className={`group relative overflow-hidden p-4 rounded-[20px] text-left border-[2px] transition-all duration-300 flex flex-col gap-1 w-full ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                      }`}
                    >
                      {!isSelected && (
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                      )}
                      <div className="flex items-center w-full gap-3.5 relative z-10">
                        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <ModeIcon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[17px] font-bold transition-colors truncate ${isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                            {battleMode.label}
                          </p>
                        </div>
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      </div>
                      <div className="w-full">
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 relative z-10">
                          {battleMode.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* 中间小栏：迎战 AI */}
            <motion.div variants={item} className="flex flex-col relative h-full rounded-[32px]">
              <div className="flex items-center gap-5 mb-5 shrink-0 px-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 className="text-[18px] font-bold text-slate-900">迎战 AI</h2>
              </div>
              <div className="flex flex-col gap-4 z-10 flex-1 overflow-y-auto pb-4 pr-1">
                {AI_OPPONENTS.map((opponent) => {
                  const isSelected = aiOpponent === opponent.id;
                  let OpponentIcon;
                  switch (opponent.id) {
                    case 'mock-v1': OpponentIcon = BrainCircuit; break;
                    case 'research-baseline': OpponentIcon = FlaskConical; break;
                    default: OpponentIcon = Cpu; 
                  }

                  return (
                    <button
                      key={opponent.id}
                      onClick={() => setAiOpponent(opponent.id)}
                      className={`group relative p-6 rounded-[20px] text-left border-[2px] transition-all duration-300 flex flex-col justify-center gap-4 w-full flex-1 overflow-hidden ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50"
                      }`}
                    >
                      {!isSelected && (
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                      )}
                      <div className="flex items-center w-full gap-4 relative z-10">
                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <OpponentIcon size={26} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[19px] font-bold transition-colors truncate ${isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                            {opponent.label}
                          </p>
                        </div>
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                        </div>
                      </div>
                      <div className="w-full relative z-10">
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 pl-1">
                          {opponent.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* 🚀 右侧小栏：规则设置 */}
            <motion.div variants={item} className="flex flex-col relative h-full rounded-[32px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2.5 mb-5 shrink-0 px-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Timer className="w-4 h-4" />
                  </div>
                  <h2 className="text-[18px] font-bold text-slate-900">极速限制</h2>
                </div>
                
                <div className="flex flex-col gap-2.5 mb-8 shrink-0">
                  {TIME_OPTIONS.map((timeOption) => {
                    const isSelected = timeLimit === timeOption;
                    return (
                      <button key={timeOption} onClick={() => setTimeLimit(timeOption)}
                        className={`group relative p-4 rounded-[16px] text-left border-[2px] transition-all duration-300 flex items-center justify-between w-full shrink-0 overflow-hidden ${
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                        }`}
                      >
                        {!isSelected && (
                          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        )}
                        <span className={`text-[16px] font-bold transition-colors relative z-10 ${isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                          {timeOption} 秒
                        </span>
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center relative z-10">
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2.5 mb-5 shrink-0 px-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h2 className="text-[18px] font-bold text-slate-900">决胜局数</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3 shrink-0 pb-1">
                  {ROUND_OPTIONS.map((roundOption) => {
                    const isSelected = rounds === roundOption;
                    return (
                      <button key={roundOption} onClick={() => setRounds(roundOption)}
                        className={`group relative p-4 rounded-[16px] text-center border-[2px] transition-all duration-300 flex items-center justify-center w-full overflow-hidden ${
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                        }`}
                      >
                        {!isSelected && (
                          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        )}
                        <span className={`text-[16px] font-bold transition-colors relative z-10 ${isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                          {roundOption} 回合
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

          </motion.div>
        </main>

        <footer className="shrink-0 px-8 pb-8 lg:px-10 lg:pb-10 w-full">
          <div className="w-full flex items-center justify-center">
            <Button
              className="w-full h-[60px] lg:h-[68px] text-[18px] lg:text-[22px] font-bold bg-primary hover:bg-primary/90 text-white rounded-[24px] shadow-[0_12px_30px_-10px_rgba(22,93,255,0.5)] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin" />
                  <span className="tracking-wide">引擎就绪...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  <span className="tracking-widest">开始对战</span>
                </>
              )}
            </Button>

          </div>
        </footer>

      </motion.div>
    </div>
  );
}