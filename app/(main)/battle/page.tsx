"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BattleConfigSidebar from "@/components/battle/BattleConfigSidebar";
import BattleOpponentPanel from "@/components/battle/BattleOpponentPanel";
import BattleStatsSidebar from "@/components/battle/BattleStatsSidebar";
import { createBattle, getBattleModeHighScores, getBattleModeLeaderboard, getBattleModeStats, getBattleModelWinRates } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import type { ModeHighScore, ModeLeaderboardRow } from "@/features/battle/highScores";
import type { ModeBattleStats } from "@/features/battle/modeStats";
import type { ModelWinRateRow } from "@/features/battle/modelWinRates";
import {
  INFERENCE_MODELS,
  BATTLE_MODES,
  ROUND_OPTIONS,
  TIME_OPTIONS,
  type InferenceModelId,
} from "@/features/battle/config";

export default function BattleConfigPage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [mode, setMode] = useState<(typeof BATTLE_MODES)[number]["id"]>(BATTLE_MODES[0].id);
  const [timeLimit, setTimeLimit] = useState<(typeof TIME_OPTIONS)[number]>(TIME_OPTIONS[1]);
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]>(ROUND_OPTIONS[1]);
  const [aiModelId, setAiModelId] = useState<InferenceModelId>(INFERENCE_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modeHighScores, setModeHighScores] = useState<ModeHighScore[] | null>(null);
  const [highScoresLoading, setHighScoresLoading] = useState(true);
  const [modeLeaderboard, setModeLeaderboard] = useState<ModeLeaderboardRow[] | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [modeStats, setModeStats] = useState<ModeBattleStats | null>(null);
  const [modeStatsLoading, setModeStatsLoading] = useState(true);
  const [modelWinRates, setModelWinRates] = useState<ModelWinRateRow[] | null>(null);
  const [winRatesLoading, setWinRatesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadModePanelData = async () => {
      setLeaderboardLoading(true);
      setModeStatsLoading(true);
      setWinRatesLoading(true);
      try {
        const [lbRes, statsRes, winRes] = await Promise.all([
          getBattleModeLeaderboard({ mode_type: mode, limit: 5 }),
          getBattleModeStats({ mode_type: mode }),
          getBattleModelWinRates({ mode_type: mode }),
        ]);
        if (!cancelled) {
          setModeLeaderboard(lbRes.leaderboard ?? []);
          setModeStats(statsRes);
          setModelWinRates(winRes.win_rates ?? []);
        }
      } catch {
        if (!cancelled) {
          setModeLeaderboard([]);
          setModeStats(null);
          setModelWinRates([]);
        }
      } finally {
        if (!cancelled) {
          setLeaderboardLoading(false);
          setModeStatsLoading(false);
          setWinRatesLoading(false);
        }
      }
    };

    void loadModePanelData();

    const onFocus = () => {
      void loadModePanelData();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [mode]);

  useEffect(() => {
    const uid = authUser?.uid ?? "";
    const email = authUser?.email ?? "";
    if (!uid && !email) {
      setModeHighScores(null);
      setHighScoresLoading(false);
      return;
    }

    let cancelled = false;

    const loadHighScores = async () => {
      setHighScoresLoading(true);
      try {
        const res = await getBattleModeHighScores({ cloudbase_uid: uid, email });
        if (!cancelled) {
          setModeHighScores(res.high_scores ?? []);
        }
      } catch {
        if (!cancelled) setModeHighScores([]);
      } finally {
        if (!cancelled) setHighScoresLoading(false);
      }
    };

    void loadHighScores();

    const onFocus = () => {
      void loadHighScores();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [authUser?.uid, authUser?.email]);

  const handleStart = useCallback(async () => {
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
        ai_model_id: aiModelId,
        cloudbase_uid: uid,
        email,
      });
      router.push(`/app/battle/${session_id}/play`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建对战失败。");
      setLoading(false);
    }
  }, [aiModelId, mode, rounds, router, timeLimit]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return Boolean(el.closest("[contenteditable='true']"));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.key === "Enter") {
        e.preventDefault();
        if (!loading) void handleStart();
        return;
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        if (loading) return;
        const others = INFERENCE_MODELS.filter((m) => m.id !== aiModelId);
        if (others.length === 0) return;
        const idx = Math.floor(Math.random() * others.length);
        setAiModelId(others[idx].id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aiModelId, handleStart, loading]);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 p-4 font-sans">
      <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,1800px)] flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <BattleConfigSidebar
          mode={mode}
          onModeChange={setMode}
          timeLimit={timeLimit}
          onTimeLimitChange={setTimeLimit}
          rounds={rounds}
          onRoundsChange={setRounds}
          disabled={loading}
        />

        <BattleOpponentPanel
          mode={mode}
          timeLimitSec={timeLimit}
          rounds={rounds}
          aiModelId={aiModelId}
          onSelectModel={setAiModelId}
          loading={loading}
          error={error}
          onStart={handleStart}
          modelWinRates={modelWinRates}
          winRatesLoading={winRatesLoading}
        />

        <BattleStatsSidebar
          mode={mode}
          modeHighScores={modeHighScores}
          highScoresLoading={highScoresLoading}
          modeLeaderboard={modeLeaderboard}
          leaderboardLoading={leaderboardLoading}
          modeStats={modeStats}
          modeStatsLoading={modeStatsLoading}
        />
      </div>
    </div>
  );
}
