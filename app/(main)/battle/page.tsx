"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Target, Cpu, CheckCircle2, BrainCircuit, Activity, BarChart3 } from "lucide-react";
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

// 辅助函数：由于没有本地图片，生成高质感渐变色模拟图片卡片
const getModeGradient = (index: number) => {
  const gradients = [
    "from-[#8FA4FF] to-[#6A8BFF]", // 综合模式
    "from-[#51C5A8] to-[#36A88B]", // 街景模式
    "from-[#F8C15A] to-[#E5A737]", // 通勤模式
    "from-[#F3D766] to-[#DCBB38]", // 地形模式
  ];
  return gradients[index % gradients.length];
};

const getAiGradient = (index: number) => {
  const gradients = [
    "from-[#2D3343] to-[#1E2331]", // 模拟对手
    "from-[#6441A5] to-[#4B2F7E]", // 研究基准
  ];
  return gradients[index % gradients.length];
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

  // 辅助函数：计算底部 Slider 滑块的位置百分比
  const getSliderPos = (val: number, options: readonly number[]) => {
    const idx = options.indexOf(val);
    if (idx === -1) return 0;
    return (idx / (options.length - 1)) * 100;
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] py-12 px-6 font-sans">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center">

        {/* 头部标题区 */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#165DFF] to-[#A855F7] flex items-center justify-center mb-5 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
          <h1 className="text-[36px] font-bold text-[#1D2129] leading-tight">配置 AI 对战</h1>
          <p className="mt-3 text-[18px] text-[#4E5969] max-w-[670px] leading-relaxed">
            当前页面已经支持模式、限时、回合数和 AI 对手选择，更贴近需求文档里的对战框架。
          </p>
        </div>

        {error && (
          <div className="w-full max-w-[1280px] mb-6 text-sm text-[#F53F3F] bg-[#F53F3F]/10 px-4 py-3 rounded-lg flex items-center">
            {error}
          </div>
        )}

        {/* ================= 核心 Grid 布局开始 ================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 【第一行 / 第一列】: 对战模式 */}
          <div
            className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden h-full"
            style={{
              // 添加世界地图底纹配置
              backgroundImage: 'url("/images/IMG.png")',
              backgroundSize: 'cover',        // 铺满整个容器
              backgroundPosition: 'center',   // 居中显示
              backgroundRepeat: 'no-repeat',  // 不重复
            }}
          >
            {/* 为了不让背景图太深遮挡内容，加一个半透明白色的叠加层 */}
            <div className="absolute inset-0 bg-white/90 z-0" />

            <div className="p-6 pb-2 flex justify-between items-center z-10">
              <h2 className="text-[20px] font-semibold text-[#1D2129]">对战模式</h2>
              <Target className="text-[#86909C] w-5 h-5 opacity-60" />
            </div>

            <div className="p-6 flex flex-col gap-4 z-10 flex-grow">
              {BATTLE_MODES.map((battleMode, idx) => {
                const isSelected = mode === battleMode.id;
                return (
                  <button
                    key={battleMode.id}
                    onClick={() => setMode(battleMode.id)}
                    className={`relative p-0 rounded-xl text-left border-2 transition-all overflow-hidden ${isSelected ? "border-[#165DFF] shadow-md" : "border-[#E5E6EB] bg-white/50 hover:border-[#165DFF]/30"
                      }`}
                  >
                    {/* 图片背景层 */}
                    <div className="absolute inset-0 w-full h-full z-0">
                      <img
                        src={battleMode.image}
                        alt={battleMode.label}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 文字阴影遮罩 */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                    <div className="relative z-20 p-5 pt-[70px]">
                      <p className="text-[18px] font-semibold text-white drop-shadow-md">{battleMode.label}</p>
                      <p className="mt-1 text-[13px] text-white/90 leading-snug drop-shadow-sm">{battleMode.description}</p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4 z-30 bg-[#165DFF] rounded-full p-0.5 border border-white">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 【第一行 / 第二列】: AI 对手 */}
          <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden h-full"
            style={{
              backgroundImage: 'url("/images/ai_bg.png")', // 卡片总背景
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* 半透明遮罩，保证文字清晰 */}
            <div className="absolute inset-0 bg-white/90 z-0" />

            <div className="absolute top-20 left-0 w-full h-full opacity-[0.03] pointer-events-none flex justify-center items-center z-0">
              <BrainCircuit className="w-96 h-96" />
            </div>

            <div className="p-6 pb-2 flex justify-between items-center z-10">
              <h2 className="text-[20px] font-semibold text-[#1D2129]">AI 对手</h2>
              <Cpu className="text-[#86909C] w-5 h-5 opacity-60" />
            </div>

            <div className="p-6 flex flex-col gap-4 z-10 flex-grow">
              {AI_OPPONENTS.map((opponent) => {
                const isSelected = aiOpponent === opponent.id;
                return (
                  <button
                    key={opponent.id}
                    onClick={() => setAiOpponent(opponent.id)}
                    className={`relative p-3 rounded-xl text-left border-2 transition-all ${isSelected
                      ? "border-[#165DFF] bg-white shadow-md"
                      : "border-[#E5E6EB] bg-white/80 hover:border-[#165DFF]/30"
                      }`}
                  >
                    {/* ================= 注意看这里！这就是渲染图片的地方 ================= */}
                    {opponent.image && (
                      <div className="w-full h-[96px] mb-3 rounded-lg overflow-hidden relative bg-[#F2F3F5]">
                        <img
                          src={opponent.image}
                          alt={opponent.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* ================================================================= */}

                    <p className="text-[16px] font-medium text-[#1D2129]">{opponent.label}</p>
                    <p className="mt-1 text-[14px] text-[#4E5969] leading-snug">{opponent.description}</p>

                    {isSelected && (
                      <div className="absolute top-5 right-5 z-30 bg-[#165DFF] rounded-full p-0.5 border border-white">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 【第一行 / 第三列】: 每轮限时 */}
          <div
            className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden h-full"
            style={{
              // 添加世界地图底纹配置
              backgroundImage: 'url("/images/time.png")',
              backgroundSize: 'cover',        // 铺满整个容器
              backgroundPosition: 'center',   // 居中显示
              backgroundRepeat: 'no-repeat',  // 不重复
            }}
          >
            {/* 为了不让背景图太深遮挡内容，加一个半透明白色的叠加层 */}
            <div className="absolute inset-0 bg-white/90 z-0" />

            <div className="p-6 pb-2 flex justify-between items-center z-10">
              <h2 className="text-[20px] font-semibold text-[#1D2129]">每轮限时</h2>
              <Clock className="text-[#86909C] w-5 h-5 opacity-60" />
            </div>
            <div className="p-6 flex flex-col gap-4 z-10">
              {TIME_OPTIONS.map((timeOption) => {
                const isSelected = timeLimit === timeOption;
                return (
                  <button
                    key={timeOption}
                    onClick={() => setTimeLimit(timeOption)}
                    className={`h-[56px] px-5 flex items-center justify-between rounded-xl border-2 transition-all ${isSelected ? "border-[#165DFF] bg-[#F9F9F9]" : "border-[#E5E6EB] bg-white hover:border-[#165DFF]/30"
                      }`}
                  >
                    <span className={`text-[16px] font-medium ${isSelected ? "text-[#1D2129]" : "text-[#4E5969]"}`}>
                      {timeOption} 秒
                    </span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#165DFF]" />}
                  </button>
                );
              })}
            </div>
            {/* 底部滑块指示器 */}
            <div className="mt-auto p-8 z-10 flex flex-col items-center justify-center">
              <div className="w-full relative h-1 bg-[#E5E6EB] rounded-full mb-4">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-[#1D2129] rounded-full shadow-sm transition-all duration-300"
                  style={{ left: `calc(${getSliderPos(timeLimit, TIME_OPTIONS)}% - 8px)` }}
                />
              </div>
              <p className="text-[14px] text-[#86909C]">当前: <span className="text-[#4E5969]">{timeLimit}</span> 秒</p>
            </div>
          </div>

          {/* 【第二行 / 第一列】: 回合数 */}
          <div
            className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden h-full"
            style={{
              // 添加世界地图底纹配置
              backgroundImage: 'url("/images/round.png")',
              backgroundSize: 'cover',        // 铺满整个容器
              backgroundPosition: 'center',   // 居中显示
              backgroundRepeat: 'no-repeat',  // 不重复
            }}
          >
            {/* 为了不让背景图太深遮挡内容，加一个半透明白色的叠加层 */}
            <div className="absolute inset-0 bg-white/90 z-0" />

            <div className="p-6 pb-2 flex justify-between items-center z-10">
              <h2 className="text-[20px] font-semibold text-[#1D2129]">回合数</h2>
              <Target className="text-[#86909C] w-5 h-5 opacity-60" />
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 z-10">
              {ROUND_OPTIONS.map((roundOption) => {
                const isSelected = rounds === roundOption;
                return (
                  <button
                    key={roundOption}
                    onClick={() => setRounds(roundOption)}
                    className={`h-[56px] flex items-center justify-center rounded-xl border-2 transition-all ${isSelected ? "border-[#165DFF] bg-[#F9F9F9] text-[#1D2129]" : "border-[#E5E6EB] bg-white text-[#4E5969] hover:border-[#165DFF]/30"
                      }`}
                  >
                    <span className="text-[16px] font-medium">{roundOption}</span>
                  </button>
                );
              })}
            </div>
            {/* 底部滑块指示器 */}
            <div className="mt-auto p-8 z-10 flex flex-col items-center justify-center">
              <div className="w-full relative h-1 bg-[#E5E6EB] rounded-full mb-4">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-[#1D2129] rounded-full shadow-sm transition-all duration-300"
                  style={{ left: `calc(${getSliderPos(rounds, ROUND_OPTIONS)}% - 8px)` }}
                />
              </div>
              <p className="text-[14px] text-[#86909C]">当前: <span className="text-[#4E5969]">{rounds}</span> 回合</p>
            </div>
          </div>

          {/* 【第二行 / 第二&三列】: 配置总览 (跨两列) */}
          <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] col-span-1 lg:col-span-2 flex flex-col relative overflow-hidden h-[396px]"
            style={{
              // 添加世界地图底纹配置
              backgroundImage: 'url("/images/total.png")',
              backgroundSize: 'cover',        // 铺满整个容器
              backgroundPosition: 'center',   // 居中显示
              backgroundRepeat: 'no-repeat',  // 不重复
            }}>

            <div className="absolute inset-0 bg-white/90 z-0" />
            <div className="p-6 pb-2 flex justify-between items-center z-10">
              <h2 className="text-[20px] font-semibold text-[#1D2129]">配置总览</h2>
              <Target className="text-[#86909C] w-5 h-5 opacity-60" />
            </div>
            <div className="p-6 z-10 flex-grow flex flex-col">
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* 行 1 */}
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">模式</p>
                  <p className="text-[18px] text-[#1D2129] font-semibold">{getBattleModeLabel(mode)}</p>
                </div>
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">对手</p>
                  <p className="text-[18px] text-[#1D2129] font-semibold">{getAiOpponentLabel(aiOpponent)}</p>
                </div>
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">限时</p>
                  <p className="text-[18px] text-[#1D2129] font-semibold">{timeLimit} <span className="text-[16px] font-normal">秒</span></p>
                </div>
                {/* 行 2 */}
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">回合</p>
                  <p className="text-[18px] text-[#1D2129] font-semibold">{rounds}</p>
                </div>
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">计分</p>
                  <p className="text-[14px] text-[#1D2129] font-mono mt-1 leading-tight">max(0, 5000 - distanceKm * 2)</p>
                </div>
                <div className="bg-[#F9F9F9] p-4 rounded-xl">
                  <p className="text-[14px] text-[#165DFF] font-medium mb-1">状态</p>
                  <p className="text-[16px] text-[#00B42A] font-semibold">就绪</p>
                </div>
              </div>

              {/* 底部后台扩展 */}
              <div className="mt-auto bg-gradient-to-b from-[#F9FAFB] to-[#EFF6FF] p-4 rounded-xl">
                <p className="text-[16px] text-[#1D2129] font-medium mb-1">后台扩展</p>
                <p className="text-[14px] text-[#4E5969]">provider registry、缓存和 AI 适配器选择</p>
              </div>
            </div>
          </div>

        </div>
        {/* ================= 核心 Grid 布局结束 ================= */}

        {/* 底部按钮区 */}
        <div className="mt-10 mb-8">
          <Button
            className="w-[174px] h-[48px] text-[18px] font-semibold bg-[#165DFF] hover:bg-[#0E42C9] text-white rounded-[4px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all flex items-center justify-center gap-2"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>准备中</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
                <span>开始对战</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}