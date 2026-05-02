"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, RotateCcw, PlaySquare, Home, CheckCircle2, XCircle, MapPin, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBattleResult, getTempFileURL } from "@/lib/cloudbase";

// 计算两点经纬度之间的距离 (公里)
function calculateDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return 0;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type RoundWinnerVariant = "user" | "ai" | "draw";

function roundOutcomeFromApi(round: {
  round_winner_type?: string | null;
  user_score: number;
  ai_score: number;
}): { label: string; variant: RoundWinnerVariant } {
  const t = round.round_winner_type;
  if (t === "user") return { label: "用户胜", variant: "user" };
  if (t === "ai") return { label: "AI 胜", variant: "ai" };
  if (t === "draw") return { label: "平局", variant: "draw" };
  if (round.user_score > round.ai_score) return { label: "用户胜", variant: "user" };
  if (round.ai_score > round.user_score) return { label: "AI 胜", variant: "ai" };
  return { label: "平局", variant: "draw" };
}

function sessionOutcomeLabel(
  winner: string | null | undefined,
  status?: string
): { title: string; subtitle: string; variant: RoundWinnerVariant | "pending" } {
  if (!winner && (status === "active" || status === "finished")) {
    return { title: "对局进行中", subtitle: "完成后将显示整局胜负", variant: "pending" };
  }
  if (winner === "user") {
    return { title: "本局胜利", subtitle: "总分领先 AI，干得漂亮！", variant: "user" };
  }
  if (winner === "draw") {
    return { title: "本局平局", subtitle: "你的总分与 AI 持平", variant: "draw" };
  }
  if (winner === "ai") {
    return { title: "本局失利", subtitle: "再接再厉，下次地图见", variant: "ai" };
  }
  return { title: "赛果统计", subtitle: "查看下方比分与逐轮详情", variant: "pending" };
}

// 专门负责把云函数的图片 URL 转成真实 HTTP 链接
function CloudImage({ url }: { url: string }) {
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    if (url.startsWith("cloud://") || url.startsWith("cos://")) {
      getTempFileURL(url)
        .then((res) => setSrc(res.tempFileURL))
        .catch(() => setSrc(""))
        .finally(() => setLoading(false));
    } else {
      setSrc(url);
      setLoading(false);
    }
  }, [url]);

  if (loading) {
    return <div className="w-full h-full bg-[#F2F3F5] flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-[#165DFF]" /></div>;
  }
  if (!src) {
    return <div className="w-full h-full bg-[#F2F3F5] flex items-center justify-center"><MapPin className="text-[#C9CDD4]" /></div>;
  }
  return <img src={src} alt="Round" className="w-full h-full object-cover" />;
}

interface BattleResult {
  session: {
    id: number;
    ai_model_id: string;
    mode_type: string;
    time_limit_sec: number;
    user_total_score: number;
    ai_total_score: number;
    winner: string | null;
    round_count: number;
    status?: string;
  };
  rounds: Array<{
    round_index: number;
    image_storage_url: string;
    user_guess_lat: number | null;
    user_guess_lng: number | null;
    ai_guess_lat: number | null;
    ai_guess_lng: number | null;
    user_score: number;
    ai_score: number;
    true_lat: number;
    true_lng: number;
    round_winner_type?: string | null;
    elapsed_ms?: number | null;
  }>;
}

export default function BattleResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.sessionId);

  const [result, setResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //新增：用于原生挂载大地图的 Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getBattleResult({ session_id: sessionId });
        setResult(data as BattleResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取结算数据失败");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  // 新增：渲染所有回合的十字准星和虚线
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || !result) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        return;
      }

      if (!document.getElementById("leaflet-css-summary")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-summary";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false, //  1. 先关闭默认的左上角缩放控件
        attributionControl: false,
      }).setView([30, 105], 3);

      // 2. 手动将缩放控件添加到右上角
      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // 封装生成“目标十字准星”图标的函数
      const createCrosshairIcon = (color: string, label: string) => {
        return L.divIcon({
          html: `
            <div style="position: relative; width: 32px; height: 32px;">
              <div style="position: absolute; bottom: 34px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 12px; color: #3D3D3D; font-weight: bold; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 0 0 4px #fff;">
                ${label}
              </div>
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="3.5" fill="${color}" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="${color}" stroke-width="2.5" />
                <line x1="16" y1="1" x2="16" y2="9" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="16" y1="23" x2="16" y2="31" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="1" y1="16" x2="9" y2="16" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="23" y1="16" x2="31" y2="16" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
          `,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
      };

      const bounds: [number, number][] = [];

      // 遍历所有回合进行绘制
      result.rounds.forEach((r) => {
        const roundLabel = `R${r.round_index}`;

        // A. 正确位置 (红)
        L.marker([r.true_lat, r.true_lng], {
          icon: createCrosshairIcon("#F53F3F", `${roundLabel} 答案`),
          zIndexOffset: 100,
        }).addTo(map);
        bounds.push([r.true_lat, r.true_lng]);

        // B. 我方位置 (绿)
        if (r.user_guess_lat != null && r.user_guess_lng != null) {
          L.marker([r.user_guess_lat, r.user_guess_lng], {
            icon: createCrosshairIcon("#00B42A", `你(${roundLabel})`),
          }).addTo(map);
          bounds.push([r.user_guess_lat, r.user_guess_lng]);

          // 深色虚线连线
          L.polyline(
            [
              [r.user_guess_lat, r.user_guess_lng],
              [r.true_lat, r.true_lng],
            ],
            { color: "#4E5969", weight: 1.5, dashArray: "5, 5", opacity: 0.9 }
          ).addTo(map);
        }

        // C. AI 位置 (橙)
        if (r.ai_guess_lat != null && r.ai_guess_lng != null) {
          L.marker([r.ai_guess_lat, r.ai_guess_lng], {
            icon: createCrosshairIcon("#FF7D00", `AI(${roundLabel})`),
          }).addTo(map);
          bounds.push([r.ai_guess_lat, r.ai_guess_lng]);

          // 深色虚线连线
          L.polyline(
            [
              [r.ai_guess_lat, r.ai_guess_lng],
              [r.true_lat, r.true_lng],
            ],
            { color: "#4E5969", weight: 1.5, dashArray: "5, 5", opacity: 0.9 }
          ).addTo(map);
        }
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [80, 80] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 7);
      }
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [result]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F3F5]">
        <div className="text-center">
          <p className="text-[#F53F3F] mb-4">{error}</p>
          <Button onClick={() => router.push("/app/battle/config")}>返回配置页</Button>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F3F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
      </div>
    );
  }

  const { session, rounds } = result;

  let totalUserDistance = 0;
  let totalAiDistance = 0;
  
  rounds.forEach((r) => {
    totalUserDistance += calculateDistance(r.user_guess_lat, r.user_guess_lng, r.true_lat, r.true_lng);
    totalAiDistance += calculateDistance(r.ai_guess_lat, r.ai_guess_lng, r.true_lat, r.true_lng);
  });

  const avgUserDist = rounds.length > 0 ? (totalUserDistance / rounds.length).toFixed(1) : "0";
  const avgAiDist = rounds.length > 0 ? (totalAiDistance / rounds.length).toFixed(1) : "0";
  const diffDist = Math.abs(Number(avgAiDist) - Number(avgUserDist)).toFixed(1);
  const userIsBetter = Number(avgUserDist) < Number(avgAiDist);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F2FF] to-[#D1E7FF] p-6 flex flex-col items-center">
      
      <div className="flex w-full max-w-[1440px] h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/50">
        
        {/* ================= 左侧：全景地图区 ================= */}
        <div className="flex-1 relative bg-[#F2F3F5]">
          <div className="absolute inset-0 z-0">
             {/* 替换为 useRef 原生挂载 */}
             <div ref={mapContainerRef} className="w-full h-full" />
          </div>
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-white/50 pointer-events-none">
            <h2 className="text-[#1D2129] font-bold text-lg">战局复盘地图</h2>
            <p className="text-[#86909C] text-sm">全局落点与真实轨迹对比</p>
          </div>
        </div>

        {/* ================= 右侧：战报数据侧边栏 ================= */}
        <div className="w-[460px] bg-white flex flex-col border-l border-[#E5E6EB] shadow-[-8px_0_24px_rgba(0,0,0,0.03)] z-10">
          
          <div className="p-8 pb-6 border-b border-[#E5E6EB]">
            {(() => {
              const outcome = sessionOutcomeLabel(session.winner, session.status);
              const bannerClass =
                outcome.variant === "user"
                  ? "bg-[#00B42A]/10 border-[#00B42A]/25 text-[#00B42A]"
                  : outcome.variant === "ai"
                    ? "bg-[#F53F3F]/10 border-[#F53F3F]/25 text-[#F53F3F]"
                    : outcome.variant === "draw"
                      ? "bg-amber-50 border-amber-200/80 text-amber-700"
                      : "bg-[#F2F3F5] border-[#E5E6EB] text-[#4E5969]";
              return (
                <div className={`mb-8 rounded-xl border px-4 py-3 ${bannerClass}`}>
                  <p className="text-[15px] font-black leading-tight">{outcome.title}</p>
                  <p className="text-[12px] font-medium mt-1 opacity-90">{outcome.subtitle}</p>
                  {session.status === "rewarded" ? (
                    <p className="text-[11px] font-medium mt-2 opacity-75">积分奖励已结算</p>
                  ) : null}
                </div>
              );
            })()}
            <div className="flex justify-between items-center px-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[16px] text-[#4B5563] font-medium">用户总分</span>
                <span className="text-[40px] font-black text-[#165DFF] leading-none">{session.user_total_score}</span>
              </div>
              <div className="text-[24px] font-black text-[#86909C] italic">VS</div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[16px] text-[#4B5563] font-medium">AI 总分</span>
                <span className="text-[40px] font-black text-[#F53F3F] leading-none">{session.ai_total_score}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between px-2">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] text-[#4B5563]">用户平均误差</span>
                <span className="text-[20px] font-bold text-[#165DFF]">{avgUserDist} <span className="text-[14px] font-normal">km</span></span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[14px] text-[#4B5563]">AI 平均误差</span>
                <span className="text-[20px] font-bold text-[#F53F3F]">{avgAiDist} <span className="text-[14px] font-normal">km</span></span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E6EB]/50">
              <p className="text-[14px] text-[#4E5969] leading-relaxed">
                平均误差越小表示预测越精准。
                您的平均误差比 AI {userIsBetter ? "少" : "多"} <strong className={userIsBetter ? "text-[#00B42A]" : "text-[#F53F3F]"}>{diffDist} km</strong>。
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-6 bg-[#FAFBFC]">
            <h3 className="text-[18px] font-bold text-[#1D2129] mb-4">每轮对决详情</h3>
            
            <div className="flex flex-col gap-4">
              {rounds.map((round, idx) => {
                const ro = roundOutcomeFromApi(round);
                const userWon = ro.variant === "user";
                const isDraw = ro.variant === "draw";
                return (
                  <div key={idx} className="bg-white border border-[#E5E6EB] rounded-xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">

                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1 ${
                        isDraw
                          ? "bg-amber-50 text-amber-700"
                          : userWon
                            ? "bg-[#00B42A]/10 text-[#00B42A]"
                            : "bg-[#F53F3F]/10 text-[#F53F3F]"
                      }`}
                    >
                      {isDraw ? (
                        <MinusCircle className="w-3 h-3" />
                      ) : userWon ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {ro.label}
                    </div>

                    <div className="flex justify-between items-center border-b border-[#E5E6EB] pb-3 mb-3 pr-24">
                      <span className="text-[15px] font-bold text-[#1D2129]">第 {round.round_index} 轮</span>
                      <div className="flex items-center gap-4 text-[13px] font-medium">
                        <span className="text-[#00B42A]">我方: {round.user_score}</span>
                        <span className="text-[#F53F3F]">对方: {round.ai_score}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-[100px] h-[72px] rounded-lg overflow-hidden shrink-0 border border-[#E5E6EB]">
                         <CloudImage url={round.image_storage_url} />
                      </div>

                      <div className="flex flex-col justify-center gap-1.5 w-full">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-[#86909C]">我方距离:</span>
                          <span className="font-bold text-[#1D2129]">
                            {calculateDistance(round.user_guess_lat, round.user_guess_lng, round.true_lat, round.true_lng).toFixed(0)} km
                          </span>
                        </div>
                        <div className="flex justify-between text-[13px]">
                          <span className="text-[#86909C]">AI 距离:</span>
                          <span className="font-bold text-[#1D2129]">
                            {calculateDistance(round.ai_guess_lat, round.ai_guess_lng, round.true_lat, round.true_lng).toFixed(0)} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-[#E5E6EB] flex flex-wrap gap-3">
            <Button 
              className="flex-1 h-[44px] bg-[#165DFF] hover:bg-[#0E42C9] text-white text-[15px] font-bold shadow-md"
              onClick={() => router.push("/app/battle")}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              再来一局
            </Button>
            <div className="flex w-full gap-3">
              <Button 
                variant="outline"
                className="flex-1 h-[44px] text-[#4E5969] border-[#E5E6EB] hover:bg-[#F2F3F5]"
                onClick={() => alert("回放功能开发中")}
              >
                <PlaySquare className="w-4 h-4 mr-2" />
                查看回放
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-[44px] text-[#4E5969] border-[#E5E6EB] hover:bg-[#F2F3F5]"
                onClick={() => router.push("/app")}
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
