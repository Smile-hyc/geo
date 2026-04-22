"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowRight, User, Bot, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

// 引入获取真实图片地址的云函数
import { getTempFileURL } from "@/lib/cloudbase";

export interface RoundResultExtended {
  user_score: number;
  ai_score: number;
  true_lat: number;
  true_lng: number;
  distance_km: number;
  session_ended: boolean;
  ai_guess_lat?: number;
  ai_guess_lng?: number;
  ai_distance_km?: number; 
}

interface Props {
  result: RoundResultExtended;
  imageUrl: string | null;
  guessPos: { lat: number; lng: number } | null;
  currentRound: number;
  totalRounds: number;
  onNext: () => void;
}

export default function RoundResultOverlay({
  result,
  imageUrl,
  guessPos,
  currentRound,
  totalRounds,
  onNext,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  const [realImageUrl, setRealImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // 1. 处理图片加载
  useEffect(() => {
    setImageLoading(true);
    setRealImageUrl(null);

    if (!imageUrl) {
      setImageLoading(false);
      return;
    }

    if (imageUrl.startsWith("cloud://") || imageUrl.startsWith("cos://")) {
      getTempFileURL(imageUrl)
        .then((res) => {
          setRealImageUrl(res.tempFileURL);
        })
        .catch(() => {
          setRealImageUrl(null);
        })
        .finally(() => {
          setImageLoading(false);
        });
    } else {
      setRealImageUrl(imageUrl);
      setImageLoading(false);
    }
  }, [imageUrl]);

  // 2. 初始化地图和标记
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        return;
      }

      if (!document.getElementById("leaflet-css-result")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-result";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([result.true_lat, result.true_lng], 3);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // ==========================================
      // 1. 封装一个生成“目标十字准星”图标的函数
      // ==========================================
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
          className: "", // 清空默认 Leaflet 类
          iconSize: [32, 32],
          iconAnchor: [16, 16], // 准星正中心作为地图落点
        });
      };


      // ==========================================
      // 2. 添加标记和深色虚线连线
      // ==========================================
      const bounds: [number, number][] = [];

      // A. 正确位置 (红色)
      L.marker([result.true_lat, result.true_lng], {
        icon: createCrosshairIcon("#F53F3F", "正确位置"),
        zIndexOffset: 100, 
      }).addTo(map);
      bounds.push([result.true_lat, result.true_lng]);

      // B. 我方位置 (绿色) -> 连线到正确位置
      if (guessPos) {
        L.marker([guessPos.lat, guessPos.lng], { 
          icon: createCrosshairIcon("#00B42A", "我方位置") 
        }).addTo(map);
        bounds.push([guessPos.lat, guessPos.lng]);

        L.polyline(
          [
            [guessPos.lat, guessPos.lng],
            [result.true_lat, result.true_lng],
          ],
          { color: "#4E5969", weight: 1.5, dashArray: "5, 5", opacity: 0.9 } // 深色细虚线
        ).addTo(map);
      }

      // C. AI 位置 (橙色) -> 连线到正确位置
      if (result.ai_guess_lat != null && result.ai_guess_lng != null) {
        L.marker([result.ai_guess_lat, result.ai_guess_lng], { 
          icon: createCrosshairIcon("#FF7D00", "AI位置") 
        }).addTo(map);
        bounds.push([result.ai_guess_lat, result.ai_guess_lng]);

        L.polyline(
          [
            [result.ai_guess_lat, result.ai_guess_lng],
            [result.true_lat, result.true_lng],
          ],
          { color: "#4E5969", weight: 1.5, dashArray: "5, 5", opacity: 0.9 } // 深色细虚线
        ).addTo(map);
      }

      // 调整视野
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [80, 80] });
      } else {
        map.setView([result.true_lat, result.true_lng], 7);
      }
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [result, guessPos]);

  // 模拟历史对战进度数据
  const mockHistory = Array.from({ length: Math.min(currentRound, 3) }).map((_, i) => ({
      round: currentRound - Math.min(currentRound, 3) + i + 1,
      time: Math.floor(Math.random() * 30 + 20),
      myScore: Math.floor(Math.random() * 40 + 60),
      aiScore: Math.floor(Math.random() * 40 + 60),
  }));

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#F2F3F5] animate-in fade-in duration-500">
      
      {/* 1. 全屏地图底层 */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* 2. 右上角：对战进度面板 */}
      <div className="absolute top-6 right-6 z-20 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E5E6EB] px-6 py-4">
        <h3 className="text-center text-[#1D2129] font-bold text-[15px] mb-3">对战进度</h3>
        <div className="flex gap-6">
          {mockHistory.map((h) => {
            const isCurrent = h.round === currentRound;
            return (
              <div key={h.round} className="flex flex-col gap-1.5 min-w-[70px]">
                <span className={`text-[13px] font-medium ${isCurrent ? 'text-[#165DFF]' : 'text-[#4E5969]'}`}>
                  第 {h.round} 轮
                </span>
                <span className="text-[12px] text-[#4E5969]">
                  用时: {isCurrent ? "38" : h.time}s
                </span>
                <span className="text-[12px] text-[#4E5969] whitespace-nowrap flex items-center">
                  <span className="text-[#00B42A]">我方: {isCurrent ? result.user_score : h.myScore}</span>
                  <span className="mx-1 text-[#E5E6EB]">|</span>
                  <span className="text-[#F53F3F]">对方: {isCurrent ? result.ai_score : h.aiScore}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. 左下角：当前图片与真实位置 */}
      <div className="absolute bottom-8 left-8 z-20 w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.15)] border-2 border-white/80 group bg-black/10">
        {imageUrl && (
          <img src={imageUrl} alt="Round Image" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="text-white font-bold text-[14px] drop-shadow-md truncate">
            回合目标位置
          </h3>
          <p className="text-white/80 text-[12px] mt-1 leading-snug drop-shadow-sm">
            真实坐标: {Math.abs(result.true_lat).toFixed(4)}°{result.true_lat >= 0 ? 'N' : 'S'}, {Math.abs(result.true_lng).toFixed(4)}°{result.true_lng >= 0 ? 'E' : 'W'}
          </p>
        </div>
      </div>

      {/* 4. 底部居中：悬浮结算数据舱 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-[#E5E6EB]/50 px-10 py-5 flex items-center gap-12">
        
        <div className="flex flex-col items-center w-[100px]">
          <span className="text-[#86909C] text-[13px] font-medium mb-1">AI 距离</span>
          <span className="text-[#165DFF] text-[20px] font-bold whitespace-nowrap">
            {result.ai_distance_km != null ? result.ai_distance_km.toLocaleString() : "2,450"} <span className="text-[14px]">km</span>
          </span>
        </div>

        <div className="flex flex-col items-center w-[100px]">
          <span className="text-[#86909C] text-[13px] font-medium mb-1">我方距离</span>
          <span className="text-[#00B42A] text-[20px] font-bold whitespace-nowrap">
            {result.distance_km.toLocaleString()} <span className="text-[14px]">km</span>
          </span>
        </div>

        <div className="shrink-0 flex items-center justify-center mx-4">
          <Button
            className="w-[140px] h-[48px] text-[16px] font-bold bg-[#165DFF] hover:bg-[#0E42C9] text-white rounded-lg shadow-md transition-transform hover:scale-105"
            onClick={onNext}
          >
            {result.session_ended ? "最终战报" : "NEXT"}
          </Button>
        </div>

        <div className="flex flex-col items-center w-[60px]">
          <span className="text-[#86909C] text-[13px] font-medium mb-1">我方得分</span>
          <span className="text-[#00B42A] text-[24px] font-black">{result.user_score}</span>
        </div>

        <div className="flex flex-col items-center w-[60px]">
          <span className="text-[#86909C] text-[13px] font-medium mb-1">对方得分</span>
          <span className="text-[#F53F3F] text-[24px] font-black">{result.ai_score}</span>
        </div>

      </div>
    </div>
  );
}
