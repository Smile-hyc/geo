"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBattleResult } from "@/lib/cloudbase";

const MapDisplay = dynamic(() => import("@/components/map/MapDisplay"), { ssr: false });

interface BattleResult {
  session: {
    id: number; mode_type: string;
    user_total_score: number; ai_total_score: number;
    winner: string; round_count: number;
  };
  rounds: Array<{
    round_index: number; image_storage_url: string;
    user_guess_lat: number; user_guess_lng: number;
    ai_guess_lat: number; ai_guess_lng: number;
    user_score: number; ai_score: number;
    true_lat: number; true_lng: number;
  }>;
}

export default function BattleResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.sessionId);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBattleResult({ session_id: sessionId })
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "加载结果失败"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-destructive mb-4">{error ?? "加载失败"}</p>
        <Button onClick={() => router.push("/battle")}>返回</Button>
      </div>
    );
  }

  const { session, rounds } = result;
  const won = session.winner === "user";
  const draw = session.winner === "draw";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-4 rounded-full bg-accent/30">
          <Trophy className={`h-10 w-10 ${won ? "text-yellow-400" : draw ? "text-muted-foreground" : "text-red-400"}`} />
        </div>
        <h1 className="text-2xl font-bold">
          {won ? "你赢了！" : draw ? "平局！" : "AI 获胜"}
        </h1>
        <p className="text-muted-foreground">对战结束 · {session.mode_type} 模式</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <User className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">你</p>
              <p className={`text-3xl font-bold ${won ? "text-green-400" : ""}`}>
                {session.user_total_score}
              </p>
            </div>
            <div className="text-xl font-semibold text-muted-foreground">VS</div>
            <div className="text-center">
              <Bot className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">AI</p>
              <p className={`text-3xl font-bold ${!won && !draw ? "text-green-400" : ""}`}>
                {session.ai_total_score}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-semibold">每轮详情</h2>
        {rounds.map((round, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">第 {round.round_index + 1} 轮</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">你：+{round.user_score}</span>
                <span className="text-red-400">AI：+{round.ai_score}</span>
              </div>
              <MapDisplay
                markers={[
                  { lat: round.user_guess_lat, lng: round.user_guess_lng, label: "你", color: "#22c55e" },
                  { lat: round.ai_guess_lat, lng: round.ai_guess_lng, label: "AI", color: "#f97316" },
                  { lat: round.true_lat, lng: round.true_lng, label: "真实", color: "#ef4444" },
                ]}
                height="200px"
                drawLines
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => router.push("/battle")}>
          再来一局
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => router.push("/home")}>
          返回首页
        </Button>
      </div>
    </div>
  );
}
