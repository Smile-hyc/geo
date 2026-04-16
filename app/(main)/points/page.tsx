"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { callFunction } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface LedgerEntry {
  id: number;
  change_amount: number;
  balance_after: number;
  reason_type: string;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  annotation_reward: "标注奖励",
  battle_reward: "对战奖励",
  quality_bonus: "质量加成",
  admin_adjust: "管理员调整",
  prize_redemption: "奖品兑换",
};

export default function PointsPage() {
  const user = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: LedgerEntry[] }>("get-points-history", {
      cloudbase_uid: user?.uid,
      email: user?.email,
    })
      .then((res) => setEntries(res.entries ?? []))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载积分流水失败。");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.email]);

  return (
    <div className="space-y-4">
      <section className="wg-panel p-5">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-[#b2cfbb]" />
          <h1 className="text-xl font-semibold text-[#f2fff5]">积分流水</h1>
        </div>
        <p className="mt-1 text-sm text-[#c1d6c8]">追踪标注与对战带来的每一次积分变动</p>
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
            {"\u6682\u65e0\u79ef\u5206\u6d41\u6c34\u3002"}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-md bg-[rgba(45,84,57,0.8)] p-2">
                    {entry.change_amount >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-200" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-200" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#f3fff6]">
                      {REASON_LABELS[entry.reason_type] ?? entry.reason_type}
                    </p>
                    <p className="text-xs text-[#9fb9aa]">
                      {new Date(entry.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={
                      entry.change_amount >= 0
                        ? "text-sm font-semibold text-green-200"
                        : "text-sm font-semibold text-red-200"
                    }
                  >
                    {entry.change_amount >= 0 ? "+" : ""}
                    {entry.change_amount}
                  </p>
                  <p className="text-xs text-[#9fb9aa]">余额 {entry.balance_after}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
