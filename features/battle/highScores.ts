/** 各模式历史最高对战得分（来自 battle_sessions.user_total_score） */
export interface ModeHighScore {
  mode_type: string;
  best_score: number;
  achieved_at: string | null;
}

export function findModeHighScore(
  scores: ModeHighScore[] | null | undefined,
  mode: string
): ModeHighScore | null {
  if (!scores?.length) return null;
  return scores.find((s) => s.mode_type === mode) ?? null;
}

export function formatHighScoreDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 某模式下按历史最高对战得分排名 */
export interface ModeLeaderboardRow {
  rank: number;
  username: string;
  best_score: number;
}
