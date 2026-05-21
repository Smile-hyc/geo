/** 指定模式的全服对战统计 */
export interface ModeBattleStats {
  mode_type: string;
  total_battles: number;
  count_7d: number;
  /** 近 7 个自然日每日局数（含今日，由旧到新） */
  daily_counts: number[];
  as_of: string;
}

export function formatStatsAsOf(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
