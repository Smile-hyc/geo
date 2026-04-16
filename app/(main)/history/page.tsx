"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, MapPin, Swords } from "lucide-react";

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
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-200",
  approved: "text-green-200",
  rejected: "text-red-200",
};

export default function HistoryPage() {
  const user = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: HistoryEntry[] }>("get-user-history", {
      cloudbase_uid: user?.uid,
      email: user?.email,
    })
      .then((res) => setEntries(res.entries ?? []))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载历史记录失败。");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.email]);

  return (
    <div className="space-y-4">
      <section className="wg-panel p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#b2cfbb]" />
          <h1 className="text-xl font-semibold text-[#f2fff5]">历史记录</h1>
        </div>
        <p className="mt-1 text-sm text-[#c1d6c8]">查看最近的标注与对战记录</p>
      </section>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#d9eddf]" />
        </div>
      ) : null}

      {error ? <p className="text-center text-sm text-red-200">{error}</p> : null}

      {!loading && entries.length === 0 && !error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[#bfd4c6]">
            {"\u6682\u65e0\u5386\u53f2\u8bb0\u5f55\u3002"}
          </CardContent>
        </Card>
      ) : null}

      {entries.map((entry) => (
        <Card key={`${entry.type}-${entry.id}`}>
          <CardContent className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-[rgba(45,84,57,0.8)] p-2">
                {entry.type === "annotation" ? (
                  <MapPin className="h-4 w-4 text-[#def5e6]" />
                ) : (
                  <Swords className="h-4 w-4 text-[#def5e6]" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#f3fff6]">
                    {entry.type === "annotation" ? "标注" : "对战"}
                    <span className="ml-2 text-xs font-normal text-[#a8c4b2]">{entry.mode_type}</span>
                  </p>
                  <p className="text-xs text-[#a8c4b2]">
                    {new Date(entry.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                {entry.annotation ? (
                  <div className="mt-2 space-y-1">
                    <p className="line-clamp-2 text-xs text-[#bfd4c6]">
                      {entry.annotation.thought_text || "无推理文本。"}
                    </p>
                    <p className="text-xs text-[#d9ece0]">
                      最终答案：{entry.annotation.final_answer || "-"}
                      <span className={`ml-2 ${STATUS_COLORS[entry.annotation.quality_status] ?? "text-[#bfd4c6]"}`}>
                        {STATUS_LABELS[entry.annotation.quality_status] ?? entry.annotation.quality_status}
                      </span>
                    </p>
                  </div>
                ) : null}

                {entry.battle ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#d9ece0]">
                    <span>我方 {entry.battle.user_total_score}</span>
                    <span className="text-[#9fb9aa]">对</span>
                    <span>AI {entry.battle.ai_total_score}</span>
                    <span>
                      {entry.battle.winner === "user"
                        ? "胜"
                        : entry.battle.winner === "draw"
                          ? "平"
                          : "负"}
                    </span>
                    <span className="text-[#9fb9aa]">{entry.battle.round_count} 回合</span>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
