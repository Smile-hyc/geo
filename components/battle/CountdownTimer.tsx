"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  seconds: number;
  onExpire?: () => void;
  running?: boolean;
}

export default function CountdownTimer({ seconds, onExpire, running = true }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds]);

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

  const pct = (remaining / seconds) * 100;
  const color =
    pct > 50 ? "text-green-400" : pct > 25 ? "text-yellow-400" : "text-red-400";
  const ringColor =
    pct > 50 ? "stroke-green-400" : pct > 25 ? "stroke-yellow-400" : "stroke-red-400";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="4"
            className="text-border" />
          <circle
            cx="32" cy="32" r={r} fill="none" strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={circ - dash}
            strokeLinecap="round"
            className={`transition-all ${ringColor}`}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${color}`}>
          {remaining}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">秒</p>
    </div>
  );
}
