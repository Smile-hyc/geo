/**
 * 对战右侧统计面板占位数据，后续可替换为云函数 API。
 */
import { getBattleModeLabel } from "@/features/battle/config";

export type BattleModeId = "general" | "street_view" | "remote_sensing" | "terrain";

function hashSeed(parts: string[]): number {
  let h = 2166136261;
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) {
      h ^= p.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

function jitter(base: number, seed: number, amplitude: number): number {
  const x = Math.sin(seed * 12.9898 + base * 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round(base + (frac * 2 - 1) * amplitude);
}

/** 近 7 日对战热度（mock） + sparkline 点 */
export function getMockModeHeat(mode: string): { count7d: number; sparklinePoints: number[] } {
  const seed = hashSeed([mode]) % 10000;
  const baseByMode: Record<string, number> = {
    general: 12842,
    street_view: 9620,
    remote_sensing: 7420,
    terrain: 5810,
  };
  const base = baseByMode[mode] ?? 10000;
  const count7d = jitter(base, seed, 800);
  const pts: number[] = [];
  let v = count7d * 0.85;
  for (let i = 0; i < 7; i++) {
    v += jitter(420, seed + i * 17, 200);
    pts.push(Math.max(200, Math.round(v)));
  }
  return { count7d, sparklinePoints: pts };
}

export function getMockUserHighScore(mode: string): {
  points: number;
  achievedAt: string;
  modeLabel: string;
} {
  const seed = hashSeed([mode, "high"]);
  return {
    points: jitter(1236, seed, 120),
    achievedAt: "2025-04-12",
    modeLabel: getBattleModeLabel(mode),
  };
}

export function getMockTotalBattles(mode: string): { total: number; asOfDate: string } {
  const seed = hashSeed([mode, "total"]);
  const base = 2_153_678;
  return {
    total: jitter(base, seed, 90_000),
    asOfDate: new Date().toISOString().slice(0, 10),
  };
}

export interface MockLeaderRow {
  rank: number;
  username: string;
  points: number;
}

export function getMockTop5Leaderboard(mode: string, timeLimitSec: number): MockLeaderRow[] {
  const seed = hashSeed([mode, String(timeLimitSec), "top5"]);
  const names = ["子午", "Kesizar", "寻境客", "GeoFox", "星图"];
  return names.map((username, i) => ({
    rank: i + 1,
    username,
    points: jitter(2100 - i * 180, seed + i * 31, 80),
  }));
}
