/** 模型在指定模式下近 30 日战胜玩家的胜率 */
export interface ModelWinRateRow {
  ai_model_id: string;
  /** 0–100；样本为 0 时为 null */
  win_rate: number | null;
  total_battles: number;
  ai_wins: number;
}

export function findModelWinRate(
  rows: ModelWinRateRow[] | null | undefined,
  modelId: string
): ModelWinRateRow | null {
  if (!rows?.length) return null;
  return rows.find((r) => r.ai_model_id === modelId) ?? null;
}

export function formatModelWinRate(row: ModelWinRateRow | null | undefined): string {
  if (!row || row.total_battles <= 0 || row.win_rate == null) return "—";
  return `${row.win_rate.toFixed(1)}%`;
}

export function modelWinRateBarWidth(row: ModelWinRateRow | null | undefined): number {
  if (!row || row.total_battles <= 0 || row.win_rate == null) return 0;
  return Math.min(100, Math.max(0, row.win_rate));
}
