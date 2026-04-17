"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// 全面采用 page1 的电竞风图标，保留 CheckCircle2 用于卡片选中状态
import { Loader2,BrainCircuit,FlaskConical, Rocket, Timer, Trophy, Zap, Swords, Target, Cpu, CheckCircle2, Shield } from "lucide-react";
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
    // 外层：整个屏幕的浅色背景，带有一点 padding 让内部大容器悬浮
    <div className="h-screen w-full from-slate-50 to-slate-100 p-4 lg:p-6 flex flex-col font-sans overflow-hidden items-center justify-center">
      
      {/* ================= 核心：一体化大容器包裹所有内容 ================= */}
      <div className="w-full max-w-[1200px] h-full flex flex-col rounded-[40px] overflow-hidden relative">
        
        {/* --- 1. 头部区域 (无独立背景，融入大容器) --- */}
        <header className="shrink-0 pt-8 px-8 lg:px-10 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 leading-none tracking-tight">Geo Battle</h1>
              <p className="text-[13px] text-slate-500 mt-1 font-medium tracking-wide">AI 对战配置引擎</p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-500 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full flex items-center animate-pulse font-medium">
              <Zap className="w-4 h-4 mr-1.5" />
              {error}
            </div>
          )}
        </header>

        {/* --- 2. 主体选择区 (剥离各自的背景色和阴影，清爽排列) --- */}
        <main className="flex-1 p-8 lg:p-10 min-h-0 z-10 flex flex-col">
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* 【左侧小栏】: 对战模式 */}
            <div className="flex flex-col relative h-full">
              <div className="flex items-center gap-5 mb-5 shrink-0 px-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-[18px] font-bold text-slate-900">选取战场</h2>
              </div>
              
              <div className="flex flex-col gap-5 z-10 flex-1 overflow-y-auto pb-4 pr-1">
                {BATTLE_MODES.map((battleMode) => {
                  const isSelected = mode === battleMode.id;
                  
                  let ModeIcon;
                  switch (battleMode.id) {
                    case 'general':
                      ModeIcon = MapPin;
                      break;
                    case 'street_view':
                      ModeIcon = Route;
                      break;
                    case 'remote_sensing':
                      ModeIcon = Briefcase;
                      break;
                    case 'terrain':
                      ModeIcon = Mountain;
                      break;
                    default:
                      ModeIcon = Target;
                  }

                  return (
                    <button
                      key={battleMode.id}
                      onClick={() => setMode(battleMode.id)}
                      // 1. 最外层改为 flex-col (垂直排布)，控制上下区域的间距 (gap-3)
                      className={`group relative p-4 rounded-[16px] text-left border-[2px] transition-all duration-300 flex flex-col gap-1 w-full ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                      }`}
                    >
                      {/* --- 上半部分：图标 + 主标题 + 打勾 --- */}
                      <div className="flex items-center w-full gap-3.5">
                        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <ModeIcon size={22} />
                        </div>
                        
                        {/* 1.2 主标题区域 */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[17px] font-bold transition-colors truncate ${
                            isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'
                          }`}>
                            {battleMode.label}
                          </p>
                        </div>

                        {/* 1.3 打勾状态 */}
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      </div>

                      {/* --- 下半部分：辅助文字 (描述) --- */}
                      <div className="w-full">
                        {/* 放宽了一点行高和字号，使其更贴近参考图的阅读体验 */}
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                          {battleMode.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 【中间小栏】: AI 对手 */}
            <div className="flex flex-col relative h-full">
              <div className="flex items-center gap-2.5 mb-5 shrink-0 px-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 className="text-[18px] font-bold text-slate-900">迎战 AI</h2>
              </div>
              <div className="flex flex-col gap-5 z-10 flex-1 overflow-y-auto pb-4 pr-1">
                {AI_OPPONENTS.map((opponent) => {
                  const isSelected = aiOpponent === opponent.id;
                  
                  // 为每个 AI 对手选择一个合理的图标
                  let OpponentIcon;
                  switch (opponent.id) {
                    case 'mock-v1': 
                      OpponentIcon = BrainCircuit; 
                      break;
                    case 'research-baseline':
                      OpponentIcon = FlaskConical; 
                      break;
                    default:
                      OpponentIcon = Cpu; 
                  }

                  return (
                    <button
                      key={opponent.id}
                      onClick={() => setAiOpponent(opponent.id)}
                      // 关键修改 1：把 shrink-0 换成了 flex-1，这样按钮会自动拉伸填满父容器的高度
                      // 关键修改 2：加上 justify-center 使得内部文字和图标垂直居中，并加大 padding (p-6)
                      className={`group relative p-6 rounded-[24px] text-left border-[2px] transition-all duration-300 flex flex-col justify-center gap-4 w-full flex-1 ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50"
                      }`}
                    >
                      {/* --- 上半部分：图标 + 主标题 + 打勾 --- */}
                      <div className="flex items-center w-full gap-4">
                        {/* 关键修改 3：稍微放大了大卡片的图标外壳 (w-14 h-14) 和图标尺寸 (size={26}) */}
                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <OpponentIcon size={26} />
                        </div>
                        
                        {/* 主标题区域 */}
                        <div className="flex-1 min-w-0">
                          {/* 字号也从 17px 稍微提到了 19px */}
                          <p className={`text-[19px] font-bold transition-colors truncate ${
                            isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'
                          }`}>
                            {opponent.label}
                          </p>
                        </div>

                        {/* 打勾状态 */}
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                        </div>
                      </div>

                      {/* --- 下半部分：辅助文字 (描述) --- */}
                      <div className="w-full">
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 pl-1">
                          {opponent.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 【右侧小栏】: 游戏规则设置 */}
            <div className="flex flex-col relative h-full">
              <div className="flex flex-col h-full">
                
                <div className="flex items-center gap-2.5 mb-5 shrink-0 px-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Timer className="w-4 h-4" />
                  </div>
                  <h2 className="text-[18px] font-bold text-slate-900">极速限制</h2>
                </div>
                
                <div className="flex flex-col gap-3.5 mb-8 shrink-0">
                  {TIME_OPTIONS.map((timeOption) => {
                    const isSelected = timeLimit === timeOption;
                    return (
                      <button key={timeOption} onClick={() => setTimeLimit(timeOption)}
                        // 统一的外框、过渡动画和悬停阴影
                        className={`group relative p-4 rounded-[16px] text-left border-[2px] transition-all duration-300 flex items-center justify-between w-full shrink-0 ${
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                        }`}
                      >
                        {/* 文本悬停变色 */}
                        <span className={`text-[16px] font-bold transition-colors ${
                          isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'
                        }`}>
                          {timeOption} 秒
                        </span>
                        {/* 统一使用打勾图标代替原本的实心蓝点 */}
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
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
                
                <div className="grid grid-cols-2 gap-3.5 shrink-0 pb-1">
                  {ROUND_OPTIONS.map((roundOption) => {
                    const isSelected = rounds === roundOption;
                    return (
                      <button key={roundOption} onClick={() => setRounds(roundOption)}
                        // 同样统一成这种中空轻量的卡片风格，不再用沉重的纯蓝底色块
                        className={`group relative p-4 rounded-[16px] text-center border-[2px] transition-all duration-300 flex items-center justify-center w-full ${
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"
                        }`}
                      >
                        <span className={`text-[16px] font-bold transition-colors ${
                          isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'
                        }`}>
                          {roundOption} 回合
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* --- 3. 底部状态栏 (无缝衔接在大容器最底端) --- */}
        <footer className="shrink-0 h-[90px] border-t border-slate-100 flex items-center justify-center px-8 lg:px-10">
          <div className="w-full flex items-center justify-between">
            
            <div className="flex items-center gap-6 lg:gap-14 hidden sm:flex pl-2">
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">战场模式</span>
                <span className="text-[16px] font-bold text-slate-900">{getBattleModeLabel(mode)}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">迎战对手</span>
                <span className="text-[16px] font-bold text-slate-900">{getAiOpponentLabel(aiOpponent)}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">规则限制</span>
                <span className="text-[16px] font-bold text-primary">{timeLimit}秒 <span className="text-slate-400 font-normal mx-1">/</span> {rounds}局</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                className="w-[120px] lg:w-[150px] h-[56px] lg:h-[60px] text-[16px] lg:text-[18px] font-bold bg-white/50 border-[2px] border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 rounded-[24px] transition-all"
                onClick={() => router.push("/app/home")}
              >
                取消并返回
              </Button>
              <Button
                className="flex-1 sm:flex-none sm:w-[200px] lg:w-[240px] h-[56px] lg:h-[60px] text-[18px] lg:text-[20px] font-bold bg-primary hover:bg-primary/90 text-white rounded-[24px] shadow-lg shadow-primary/40 transition-all flex items-center justify-center gap-2 lg:gap-3 hover:-translate-y-1 active:translate-y-0"
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="tracking-wide">引擎就绪...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span className="tracking-widest">开始对战</span>
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </footer>

      </div>
    </div>
  );
}