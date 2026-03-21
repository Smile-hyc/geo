"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CountdownTimer from "@/components/battle/CountdownTimer";
import BattleScoreBoard from "@/components/battle/BattleScoreBoard";
import { getBattleResult, getTempFileURL, submitBattleRound } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { getAiOpponentLabel, getBattleModeLabel } from "@/features/battle/config";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
});
const MapDisplay = dynamic(() => import("@/components/map/MapDisplay"), {
  ssr: false,
});

interface RoundResult {
  user_score: number;
  ai_score: number;
  true_lat: number;
  true_lng: number;
  distance_km: number;
  session_ended: boolean;
}

interface SessionInfo {
  ai_model_id?: string;
  mode_type: string;
  time_limit_sec: number;
  round_count: number;
}

export default function BattlePlayPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [guessPos, setGuessPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [userTotal, setUserTotal] = useState(0);
  const [aiTotal, setAiTotal] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guessRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    guessRef.current = guessPos;
  }, [guessPos]);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await getBattleResult({ session_id: sessionId });
        setSession({
          ai_model_id: result.session.ai_model_id,
          mode_type: result.session.mode_type,
          time_limit_sec: result.session.time_limit_sec,
          round_count: result.session.round_count,
        });
        setUserTotal(result.session.user_total_score);
        setAiTotal(result.session.ai_total_score);
        await loadRoundImage(result.rounds[0]?.image_storage_url);
        setTimerRunning(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "加载对战失败。");
      }
    };

    init();
  }, [sessionId]);

  const loadRoundImage = async (storageUrl?: string) => {
    setImageLoading(true);
    setImageUrl(null);

    if (!storageUrl) {
      setImageLoading(false);
      return;
    }

    try {
      let url = storageUrl;
      if (url.startsWith("cloud://") || url.startsWith("cos://")) {
        const file = await getTempFileURL(url);
        url = file.tempFileURL;
      }
      setImageUrl(url);
    } catch {
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmitRound = async () => {
    if (submitting || roundResult) {
      return;
    }

    setTimerRunning(false);
    setSubmitting(true);

    const position = guessRef.current ?? { lat: 0, lng: 0 };

    try {
      const result = await submitBattleRound({
        session_id: sessionId,
        round_index: currentRound,
        user_guess_lat: position.lat,
        user_guess_lng: position.lng,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });

      setRoundResult(result);
      setUserTotal((value) => value + result.user_score);
      setAiTotal((value) => value + result.ai_score);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交本轮结果失败。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    if (!roundResult) {
      return;
    }

    if (roundResult.session_ended) {
      router.push(`/app/battle/${sessionId}/result`);
      return;
    }

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setRoundResult(null);
    setGuessPos(null);
    setTimerKey((value) => value + 1);
    setImageLoading(true);

    try {
      const result = await getBattleResult({ session_id: sessionId });
      await loadRoundImage(result.rounds[nextRound]?.image_storage_url);
      setTimerRunning(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "加载下一轮失败。"
      );
    }
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/app/battle")}>
          返回对战配置
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">
            对战进行中
          </p>
          <h1 className="text-2xl font-semibold">
            {getBattleModeLabel(session.mode_type)}
          </h1>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            对手：{getAiOpponentLabel(session.ai_model_id || "mock-v1")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <BattleScoreBoard
            userScore={userTotal}
            aiScore={aiTotal}
            currentRound={currentRound + 1}
            totalRounds={session.round_count}
          />
          <CountdownTimer
            key={timerKey}
            seconds={session.time_limit_sec}
            running={timerRunning && !roundResult}
            onExpire={handleSubmitRound}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-0">
            {imageLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="对战题目"
                className="w-full rounded-lg object-cover max-h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                图片加载失败。
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {!roundResult ? (
            <>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                在地图上落点，标记你认为图片所在的位置。
              </p>
              <MapPicker value={guessPos} onChange={setGuessPos} height="280px" />
              <Button
                className="w-full"
                onClick={handleSubmitRound}
                disabled={submitting || !guessPos}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交猜测中
                  </>
                ) : (
                  "锁定猜测"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-accent/30 p-3 text-center space-y-1">
                <p className="text-sm text-muted-foreground">本轮结果</p>
                <div className="flex justify-around">
                  <div>
                    <p className="text-xs text-muted-foreground">你</p>
                    <p className="text-2xl font-bold text-green-500">
                      +{roundResult.user_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI</p>
                    <p className="text-2xl font-bold text-rose-500">
                      +{roundResult.ai_score}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  你与真实位置的距离：{roundResult.distance_km} km
                </p>
              </div>

              <MapDisplay
                markers={[
                  ...(guessPos
                    ? [
                        {
                          lat: guessPos.lat,
                          lng: guessPos.lng,
                          label: "你",
                          color: "#22c55e",
                        },
                      ]
                    : []),
                  {
                    lat: roundResult.true_lat,
                    lng: roundResult.true_lng,
                    label: "真实位置",
                    color: "#ef4444",
                  },
                ]}
                height="200px"
                drawLines
              />

              <Button className="w-full" onClick={handleNextRound}>
                {roundResult.session_ended ? "查看最终结果" : "下一轮"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
