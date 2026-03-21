"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createBattle } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import {
  AI_OPPONENTS,
  BATTLE_MODES,
  ROUND_OPTIONS,
  TIME_OPTIONS,
  getAiOpponentLabel,
  getBattleModeLabel,
} from "@/features/battle/config";

export default function BattleConfigPage() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof BATTLE_MODES)[number]["id"]>(
    BATTLE_MODES[0].id
  );
  const [timeLimit, setTimeLimit] = useState<(typeof TIME_OPTIONS)[number]>(
    TIME_OPTIONS[1]
  );
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]>(
    ROUND_OPTIONS[1]
  );
  const [aiOpponent, setAiOpponent] = useState<
    (typeof AI_OPPONENTS)[number]["id"]
  >(AI_OPPONENTS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    const currentUser = useAuthStore.getState().user;
    const uid = currentUser?.uid ?? "";
    const email = currentUser?.email ?? "";

    if (!uid && !email) {
      setError("登录状态尚未就绪，请刷新后重试。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { session_id } = await createBattle({
        mode_type: mode,
        time_limit_sec: timeLimit,
        round_count: rounds,
        ai_model_id: aiOpponent,
        cloudbase_uid: uid,
        email,
      });
      router.push(`/app/battle/${session_id}/play`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建对战失败。");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 mb-4">
          <Swords className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-semibold">配置 AI 对战</h1>
        <p className="mt-2 text-muted-foreground">
          当前页面已经支持模式、限时、回合数和 AI 对手选择，更贴近需求文档里的对战框架。
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>对战模式</CardTitle>
            <CardDescription>
              选择本次对战要抽取的题目类型。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {BATTLE_MODES.map((battleMode) => (
              <button
                key={battleMode.id}
                type="button"
                onClick={() => setMode(battleMode.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === battleMode.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="font-medium">{battleMode.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {battleMode.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>AI 对手</CardTitle>
            <CardDescription>
              当前后端仍使用模拟 provider，但 session 已会明确记录所选模型。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {AI_OPPONENTS.map((opponent) => (
              <button
                key={opponent.id}
                type="button"
                onClick={() => setAiOpponent(opponent.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  aiOpponent === opponent.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="font-medium">{opponent.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {opponent.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                每轮限时
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {TIME_OPTIONS.map((timeOption) => (
                <button
                  key={timeOption}
                  type="button"
                  onClick={() => setTimeLimit(timeOption)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${
                    timeLimit === timeOption
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {timeOption}s
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>回合数</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {ROUND_OPTIONS.map((roundOption) => (
                <button
                  key={roundOption}
                  type="button"
                  onClick={() => setRounds(roundOption)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${
                    rounds === roundOption
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {roundOption}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              对战摘要
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>模式：{getBattleModeLabel(mode)}</p>
            <p>对手：{getAiOpponentLabel(aiOpponent)}</p>
            <p>限时：每轮 {timeLimit} 秒</p>
            <p>回合：{rounds}</p>
            <p>计分：max(0, 5000 - distanceKm * 2)</p>
            <Label className="pt-2 block">
              后续扩展点：provider registry、缓存和 AI 适配器选择。
            </Label>
          </CardContent>
        </Card>

        <Button className="w-full h-12 text-base" onClick={handleStart} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              正在创建对战
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
