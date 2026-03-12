"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

interface LeaderEntry {
  rank: number;
  username: string;
  points_balance: number;
  level: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard({ limit: 50 })
      .then((res) => setEntries(res.leaderboard))
      .catch((e) => setError(e instanceof Error ? e.message : "加载排行榜失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-yellow-500/10 mb-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold">全球排行榜</h1>
        <p className="text-muted-foreground text-sm mt-1">每 5 分钟更新一次</p>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {!loading && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isMe = entry.username === currentUser?.username;
            return (
              <Card
                key={entry.rank}
                className={isMe ? "border-primary/50 bg-primary/5" : ""}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center">
                      {entry.rank <= 3 ? (
                        <span className="text-xl">{RANK_ICONS[entry.rank - 1]}</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {entry.username}
                        {isMe && (
                          <span className="ml-2 text-xs text-primary">（你）</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Lv.{entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400">
                        {entry.points_balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">积分</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {entries.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无排名数据
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
