"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords, Clock, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createBattle } from "@/lib/cloudbase";

const MODES = [
  { id: "general", label: "通用地理", desc: "全球各地景观" },
  { id: "urban", label: "城市街景", desc: "城市建筑与街道" },
  { id: "nature", label: "自然风光", desc: "山川湖泊与植被" },
  { id: "landmark", label: "地标建筑", desc: "标志性地点" },
];

const TIME_OPTIONS = [15, 30, 60, 120];
const ROUND_OPTIONS = [3, 5, 10];

export default function BattleConfigPage() {
  const router = useRouter();
  const [mode, setMode] = useState("general");
  const [timeLimit, setTimeLimit] = useState(30);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const { session_id } = await createBattle({
        mode_type: mode,
        time_limit_sec: timeLimit,
        round_count: rounds,
      });
      router.push(`/battle/${session_id}/play`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建对战失败");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 mb-4">
          <Swords className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">AI 对战配置</h1>
        <p className="text-muted-foreground mt-1">在限定时间内猜测地理位置，击败 AI！</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" /> 地理模式
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    mode === m.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> 每轮限时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    timeLimit === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">对战轮数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    rounds === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {r} 轮
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-accent/30 rounded-lg p-4 text-sm space-y-1">
          <Label>对战摘要</Label>
          <p className="text-muted-foreground">
            模式：{MODES.find((m) => m.id === mode)?.label} ·
            每轮 {timeLimit} 秒 · 共 {rounds} 轮
          </p>
          <p className="text-muted-foreground">
            评分公式：max(0, 5000 - 距离km × 2)
          </p>
        </div>

        <Button
          className="w-full h-12 text-base"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              准备中…
            </>
          ) : (
            <>
              <Swords className="h-5 w-5 mr-2" />
              开始对战
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
