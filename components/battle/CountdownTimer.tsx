"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  seconds: number;
  onExpire?: () => void;
  running?: boolean;
}

export default function CountdownTimer({ seconds, onExpire, running = true }: Props) {
  // 核心安全防护：确保 seconds 是个有效数字，否则给个默认的 60 秒兜底
  const validSeconds = typeof seconds === "number" && !isNaN(seconds) ? seconds : 60;
  
  const [remaining, setRemaining] = useState(validSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(validSeconds);
    expiredRef.current = false;
  }, [validSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onExpire]);

  // UI 表现：<= 10 秒时变红（#F53F3F），平时是品牌蓝（#165DFF）
  const isUrgent = remaining <= 10;

  return (
    <span className={`tabular-nums transition-colors duration-300 ${isUrgent ? 'text-[#F53F3F]' : 'text-[#165DFF]'}`}>
      {remaining}s
    </span>
  );
}