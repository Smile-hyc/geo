"use client";

import { useEffect, useState } from "react";
import { Coins, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callFunction } from "@/lib/cloudbase";

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
  quality_bonus: "质量奖金",
  admin_adjust: "管理员调整",
};

export default function PointsPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: LedgerEntry[]; total_earned: number }>("get-points-history", {})
      .then((res) => setEntries(res.entries ?? []))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "加载积分记录失败");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Coins className="h-6 w-6 text-yellow-400" />
        <h1 className="text-xl font-bold">积分明细</h1>
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
            暂无积分记录，完成标注或对战来获取积分
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.change_amount > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {REASON_LABELS[entry.reason_type] ?? entry.reason_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${entry.change_amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {entry.change_amount > 0 ? "+" : ""}{entry.change_amount}
                  </p>
                  <p className="text-xs text-muted-foreground">余额 {entry.balance_after}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
