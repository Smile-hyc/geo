"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CountdownTimer from "@/components/battle/CountdownTimer";
import BattleScoreBoard from "@/components/battle/BattleScoreBoard";
import { submitBattleRound, getBattleResult, getTempFileURL } from "@/lib/cloudbase";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { ssr: false });
const MapDisplay = dynamic(() => import("@/components/map/MapDisplay"), { ssr: false });

interface RoundResult {
  user_score: number;
  ai_score: number;
  true_lat: number;
  true_lng: number;
  distance_km: number;
  session_ended: boolean;
}

interface SessionInfo {
  mode_type: string;
  time_limit_sec: number;
  round_count: number;
}

export default function BattlePlayPage() {
  const params = useParams();
  const router = useRouter();
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
        const res = await getBattleResult({ session_id: sessionId });
        setSession({
          mode_type: res.session.mode_type,
          time_limit_sec: 30,
          round_count: res.session.round_count,
        });
        setUserTotal(res.session.user_total_score);
        setAiTotal(res.session.ai_total_score);
        await loadRoundImage(res.rounds[0]?.image_storage_url);
        setTimerRunning(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载对战失败");
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
        const r = await getTempFileURL(url);
        url = r.tempFileURL;
      }
      setImageUrl(url);
    } catch {
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmitRound = async (forced = false) => {
    if (submitting || roundResult) return;
    setTimerRunning(false);
    setSubmitting(true);
    const pos = guessRef.current ?? { lat: 0, lng: 0 };
    try {
      const res = await submitBattleRound({
        session_id: sessionId,
        round_index: currentRound,
        user_guess_lat: pos.lat,
        user_guess_lng: pos.lng,
      });
      setRoundResult(res);
      setUserTotal((prev) => prev + res.user_score);
      setAiTotal((prev) => prev + res.ai_score);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    if (!roundResult) return;
    if (roundResult.session_ended) {
      router.push(`/battle/${sessionId}/result`);
      return;
    }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setRoundResult(null);
    setGuessPos(null);
    setTimerKey((k) => k + 1);
    setImageLoading(true);
    try {
      const res = await getBattleResult({ session_id: sessionId });
      await loadRoundImage(res.rounds[nextRound]?.image_storage_url);
      setTimerRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载下一轮失败");
    }
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/battle")}>返回</Button>
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
      <div className="flex items-center justify-between">
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
          onExpire={() => handleSubmitRound(true)}
        />
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
                alt="对战图片"
                className="w-full rounded-lg object-cover max-h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                图片加载失败
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {!roundResult ? (
            <>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" /> 在地图上标记你猜测的位置
              </p>
              <MapPicker value={guessPos} onChange={setGuessPos} height="280px" />
              <Button
                className="w-full"
                onClick={() => handleSubmitRound(false)}
                disabled={submitting || !guessPos}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />提交中…</>
                ) : (
                  "确认猜测"
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
                    <p className="text-2xl font-bold text-green-400">+{roundResult.user_score}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI</p>
                    <p className="text-2xl font-bold text-red-400">+{roundResult.ai_score}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  距离真实位置 {roundResult.distance_km} km
                </p>
              </div>
              <MapDisplay
                markers={[
                  ...(guessPos ? [{ lat: guessPos.lat, lng: guessPos.lng, label: "你", color: "#22c55e" }] : []),
                  { lat: roundResult.true_lat, lng: roundResult.true_lng, label: "真实", color: "#ef4444" },
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
