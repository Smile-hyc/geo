"use client";

import { useEffect, useState } from "react";
import { MapPin, Swords, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { callFunction } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface HistoryEntry {
  type: "annotation" | "battle";
  id: number;
  mode_type: string;
  created_at: string;
  annotation?: { thought_text: string; final_answer: string; quality_status: string };
  battle?: { user_total_score: number; ai_total_score: number; winner: string; round_count: number };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待审核", approved: "已通过", rejected: "已拒绝",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400", approved: "text-green-400", rejected: "text-red-400",
};

export default function HistoryPage() {
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: HistoryEntry[] }>("get-user-history", {
      cloudbase_uid: user?.uid,
      email: user?.email,
    })
      .then((res) => setEntries(res.entries ?? []))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "加载历史记录失败");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.email]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Clock className="h-6 w-6 text-purple-400" />
        <h1 className="text-xl font-bold">历史记录</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground text-center">{error}</p>
      )}

      {!loading && entries.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无记录
          </CardContent>
        </Card>
      )}

      {entries.map((entry) => (
        <Card key={`${entry.type}-${entry.id}`}>
          <CardContent className="py-4 px-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {entry.type === "annotation" ? (
                  <MapPin className="h-5 w-5 text-blue-400" />
                ) : (
                  <Swords className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {entry.type === "annotation" ? "标注任务" : "AI 对战"}
                    <span className="text-muted-foreground ml-2 font-normal text-xs">
                      {entry.mode_type}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(entry.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                {entry.annotation && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {entry.annotation.thought_text || "（无思维链）"}
                    </p>
                    <p className="text-xs">
                      答案：{entry.annotation.final_answer || "—"}
                      <span className={`ml-2 ${STATUS_COLORS[entry.annotation.quality_status] ?? ""}`}>
                        {STATUS_LABELS[entry.annotation.quality_status] ?? entry.annotation.quality_status}
                      </span>
                    </p>
                  </div>
                )}

                {entry.battle && (
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span>你 {entry.battle.user_total_score}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span>AI {entry.battle.ai_total_score}</span>
                    <span className={
                      entry.battle.winner === "user" ? "text-green-400" :
                      entry.battle.winner === "draw" ? "text-muted-foreground" : "text-red-400"
                    }>
                      {entry.battle.winner === "user" ? "胜" : entry.battle.winner === "draw" ? "平" : "负"}
                    </span>
                    <span className="text-muted-foreground">{entry.battle.round_count} 轮</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
