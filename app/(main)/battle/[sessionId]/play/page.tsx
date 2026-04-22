"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Compass, Settings, ZoomIn, Maximize, ZoomOut, Minimize, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/battle/CountdownTimer";
import { getBattleResult, getTempFileURL, submitBattleRound } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import RoundResultOverlay from "./RoundResultOverlay";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
});

interface RoundResult {
  user_score: number;
  ai_score: number;
  true_lat: number;
  true_lng: number;
  distance_km: number;
  ai_distance_km?: number;
  ai_guess_lat?: number;
  ai_guess_lng?: number;
  session_ended: boolean;
}

interface SessionInfo {
  ai_model_id?: string;
  mode_type: string;
  time_limit_sec: number;
  round_count: number;
}

export default function BattlePlayPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [guessPos, setGuessPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [userTotal, setUserTotal] = useState(0);
  const [aiTotal, setAiTotal] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgZoom, setBgZoom] = useState(1);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 }); // 记录图片的偏移量
  const [isDragging, setIsDragging] = useState(false); // 记录鼠标是否按下
  const dragStart = useRef({ x: 0, y: 0 }); // 记录鼠标按下的初始位置（用 useRef 防止不必要的重新渲染）
  // 原有的手动点击全屏状态
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  // 新增：鼠标悬浮状态
  const [isMapHovered, setIsMapHovered] = useState(false);
  
  const guessRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    guessRef.current = guessPos;
  }, [guessPos]);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await getBattleResult({ session_id: sessionId });
        setSession({
          ai_model_id: result.session.ai_model_id,
          mode_type: result.session.mode_type,
          time_limit_sec: result.session.time_limit_sec,
          round_count: result.session.round_count,
        });
        setUserTotal(result.session.user_total_score);
        setAiTotal(result.session.ai_total_score);
        await loadRoundImage(result.rounds[0]?.image_storage_url);
        setTimerRunning(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "加载对战失败。");
      }
    };

    init();
  }, [sessionId]);

  const loadRoundImage = async (storageUrl?: string) => {
    setImageLoading(true);
    setImageUrl(null);
    if (!storageUrl) {
      setImageLoading(false);
      return;
    }
    try {
      let url = storageUrl;
      if (url.startsWith("cloud://") || url.startsWith("cos://")) {
        const file = await getTempFileURL(url);
        url = file.tempFileURL;
      }
      setImageUrl(url);
    } catch {
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmitRound = async () => {
    if (submitting || roundResult) return;
    setTimerRunning(false);
    setSubmitting(true);
    const position = guessRef.current ?? { lat: 0, lng: 0 };

    try {
      const result = await submitBattleRound({
        session_id: sessionId,
        round_index: currentRound + 1,
        user_guess_lat: position.lat,
        user_guess_lng: position.lng,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setRoundResult(result);
      setUserTotal((value) => value + result.user_score);
      setAiTotal((value) => value + result.ai_score);
      // 提交时重置地图状态
      setIsMapExpanded(false);
      setIsMapHovered(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交本轮结果失败。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    if (!roundResult) return;
    if (roundResult.session_ended) {
      router.push(`/app/battle/${sessionId}/result`);
      return;
    }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setRoundResult(null);
    setGuessPos(null);
    setTimerKey((value) => value + 1);
    setImageLoading(true);
    // 重置地图状态与背景缩放
    setIsMapExpanded(false);
    setIsMapHovered(false);
    setBgZoom(1); //切换下一轮时重置缩放
    setBgOffset({ x: 0, y: 0 });
    try {
      const result = await getBattleResult({ session_id: sessionId });
      await loadRoundImage(result.rounds[nextRound]?.image_storage_url);
      setTimerRunning(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载下一轮失败。");
    }
  };

  // 手动点击全屏按钮的处理
  const toggleMapExpand = () => {
    setIsMapExpanded(!isMapExpanded);
    // 点击全屏时，强制关闭 hover 状态
    if (!isMapExpanded) {
      setIsMapHovered(false); 
    }
  };

  // 鼠标滚轮缩放处理函数
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      // 向上滚动：放大 (最大 5 倍)
      setBgZoom((prev) => Math.min(prev + 0.15, 5));
    } else {
      // 向下滚动：缩小 (最小 1 倍，防止比屏幕小)
      setBgZoom((prev) => Math.max(prev - 0.15, 1));
    }
  };

  // 鼠标拖动平移处理函数
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    // 记录鼠标按下时的坐标，并减去当前的偏移量，这样可以实现连续拖动
    dragStart.current = { x: e.clientX - bgOffset.x, y: e.clientY - bgOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    // 计算最新的偏移量
    setBgOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#F2F3F5]">
        <p className="text-[#F53F3F] font-medium mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/app/battle/config")}>返回对战配置</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#F2F3F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
          <span className="text-[#86909C] text-sm">初始化战场...</span>
        </div>
      </div>
    );
  }

  if (roundResult) {
    return (
      <RoundResultOverlay
        result={roundResult}
        imageUrl={imageUrl}
        guessPos={guessPos}
        currentRound={currentRound + 1}
        totalRounds={session.round_count}
        onNext={handleNextRound}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F2F3F5] font-sans">
      
      {/* 1. 猜测态：全景背景层 (绑定滚轮和拖动事件) */}
      <div 
        className={`absolute inset-0 z-0 overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`} 
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // 鼠标移出屏幕也当做松开处理
      >
        {imageLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-[#E5E6EB]/50">
            <Loader2 className="h-10 w-10 animate-spin text-[#165DFF]" />
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt="对战题目" 
            // 注意这里去掉了 transition-transform，因为拖动时需要实时跟随，加动画会有延迟感
            className="w-full h-full object-cover origin-center" 
            style={{ 
              transform: `translate(${bgOffset.x}px, ${bgOffset.y}px) scale(${bgZoom})`,
              // 在拖动时取消事件响应，防止鼠标拖动到了图片外产生 bug
              pointerEvents: isDragging ? "none" : "auto" 
            }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
            全景图片加载失败
          </div>
        )}
      </div>

      {/* 2. 猜测态：顶部透明 HUD 面板 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-[600px] h-[48px] bg-white/85 backdrop-blur-md rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-between px-8 pointer-events-auto">
          <div className="text-[14px] font-medium text-[#1D2129]">
            第 <span className="font-bold">{currentRound + 1} / {session.round_count}</span> 轮
          </div>
          <div className="text-[20px] font-bold text-[#165DFF] flex items-center">
            <CountdownTimer
              key={timerKey}
              seconds={Number(session.time_limit_sec) || 60}
              running={timerRunning}
              onExpire={handleSubmitRound}
            />
          </div>
          <div className="text-[14px] font-bold text-[#1D2129] flex items-center gap-2">
            你 <span className="text-[#165DFF] text-[16px]">{userTotal}</span> : <span className="text-[#F53F3F] text-[16px]">{aiTotal}</span> AI
          </div>
        </div>

        {/*注释掉了悬浮方位条
        <div className="flex items-center gap-3 px-6 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-[12px] font-black tracking-widest shadow-md">
          <span>N</span><div className="w-6 h-[2px] bg-[#E5E6EB]/60 rounded" />
          <span>E</span><div className="w-6 h-[2px] bg-[#E5E6EB]/60 rounded" />
          <span>S</span><div className="w-6 h-[2px] bg-[#E5E6EB]/60 rounded" />
          <span>W</span>
        </div>
        */}
      </div>

      {/* 3. 左下角悬浮工具栏 */}
      <div className="absolute bottom-10 left-8 z-10 flex flex-col gap-4">
        <button 
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-[#F2F3F5] transition-colors text-[#1D2129]"
          onClick={() => setBgZoom((prev) => Math.min(prev + 0.5, 5))} // 放大按钮
        >
          <Plus className="w-6 h-6" />
        </button>
        <button 
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-[#F2F3F5] transition-colors text-[#1D2129]"
          onClick={() => setBgZoom((prev) => Math.max(prev - 0.5, 1))} // 缩小按钮
        >
          <Minus className="w-6 h-6" />
        </button>
      </div>

      {/* 4. 猜测态：小地图与提交 */}
      {/* 仅在手动全屏时显示背景遮罩 */}
      {isMapExpanded && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={toggleMapExpand}
        />
      )}

      {/*核心交互区域：绑定 onMouseEnter 和 onMouseLeave */}
      <div 
        className={`z-40 flex flex-col gap-3 transition-all duration-300 origin-bottom-right ${
          isMapExpanded
            // 全屏状态：固定在屏幕中央
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] max-w-[1000px]"
            // 非全屏状态：判断是否 Hover
            : isMapHovered
              ? "absolute bottom-10 right-8 w-[450px]" // Hover 态：变宽
              : "absolute bottom-10 right-8 w-[320px]" // 默认态：正常尺寸
        }`}
        onMouseEnter={() => {
          if (!isMapExpanded) setIsMapHovered(true);
        }}
        onMouseLeave={() => {
          if (!isMapExpanded) setIsMapHovered(false);
        }}
      >
        <div className={`bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-white/20 flex flex-col transition-all duration-300 ${isMapExpanded ? "h-full" : ""}`}>
          <div className="flex justify-between items-center px-2 py-1.5 mb-1 shrink-0">
            <span className="text-[13px] font-bold text-[#4E5969]">小地图</span>
            <div className="flex gap-2 text-[#86909C]">
              {isMapExpanded ? (
                <>
                  <ZoomOut className="w-4 h-4 cursor-pointer hover:text-[#165DFF] transition-colors" onClick={toggleMapExpand} />
                  <Minimize className="w-4 h-4 cursor-pointer hover:text-[#165DFF] transition-colors" onClick={toggleMapExpand} />
                </>
              ) : (
                <>
                  <ZoomIn className="w-4 h-4 cursor-pointer hover:text-[#165DFF] transition-colors" onClick={toggleMapExpand} />
                  <Maximize className="w-4 h-4 cursor-pointer hover:text-[#165DFF] transition-colors" onClick={toggleMapExpand} />
                </>
              )}
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden border border-[#E5E6EB] grow transition-all duration-300">
            {/* 动态计算高度：全屏时撑满，Hover 时变高 (比如 300px)，默认 200px */}
            <MapPicker 
              value={guessPos} 
              onChange={setGuessPos} 
              height={
                isMapExpanded 
                  ? "calc(80vh - 150px)" 
                  : isMapHovered 
                    ? "300px" 
                    : "200px"
              } 
            />
          </div>

          <div className="px-2 pt-2 pb-1 text-[13px] text-[#4E5969] shrink-0 transition-opacity">
            已选择: {guessPos ? `${guessPos.lat.toFixed(4)}°N, ${guessPos.lng.toFixed(4)}°E` : "暂未落点"}
          </div>
        </div>
        
        <Button
          className="w-full h-[48px] text-[16px] font-bold bg-gradient-to-r from-[#165DFF] to-[#0E42C9] hover:from-[#0E42C9] hover:to-[#0E42C9] text-white rounded-lg shadow-[0_4px_12px_rgba(22,93,255,0.3)] transition-all border-none shrink-0"
          onClick={handleSubmitRound}
          disabled={submitting || !guessPos}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            "提交答案"
          )}
        </Button>
      </div>
    </div>
  );
}
