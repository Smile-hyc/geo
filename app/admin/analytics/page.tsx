"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary, getAnalyticsTimeseries, getAnalyticsByMode } from "@/lib/cloudbase";
import { useAuthStore, useAuthStoreHydrated } from "@/lib/auth";

export default function AdminAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStoreHydrated();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAnalyticsSummary>> | null>(null);
  const [series, setSeries] = useState<{ day: string; count: number }[]>([]);
  const [modes, setModes] = useState<{ mode_type: string; count: number }[]>([]);

  const load = useCallback(async () => {
    if (!hydrated || !user?.uid && !user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [s, ts, bm] = await Promise.all([
        getAnalyticsSummary({ cloudbase_uid: user.uid, email: user.email }),
        getAnalyticsTimeseries({ days: 30, cloudbase_uid: user.uid, email: user.email }),
        getAnalyticsByMode({ cloudbase_uid: user.uid, email: user.email }),
      ]);
      setSummary(s);
      setSeries(ts.series || []);
      setModes(bm.modes || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [hydrated, user?.uid, user?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDay = series.reduce((m, x) => Math.max(m, x.count), 0) || 1;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据分析</h1>
        <p className="text-muted-foreground text-sm mt-1">汇总、近 30 日标注趋势、按玩法模式分布（仅管理员）</p>
      </div>

      {err && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{err}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          加载中…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">用户</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{summary?.total_users ?? "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">题目图（未删）</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{summary?.total_images ?? "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">标注总数</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{summary?.total_annotations ?? "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">待审核</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{summary?.pending_reviews ?? "—"}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">按审核状态</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(summary?.by_quality || []).map((row) => (
                  <li key={row.quality_status} className="flex justify-between border-b border-border/60 pb-2">
                    <span className="font-medium">{row.quality_status}</span>
                    <span className="tabular-nums">{row.count}</span>
                  </li>
                ))}
                {!(summary?.by_quality?.length) && <li className="text-muted-foreground">暂无数据</li>}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">近 30 日每日新增标注</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {series.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无序列数据</p>
              ) : (
                <div className="flex items-end gap-0.5 h-40 overflow-x-auto pb-1">
                  {series.map((pt) => (
                    <div
                      key={pt.day}
                      className="flex flex-col items-center gap-1 min-w-[8px] flex-1"
                      title={`${pt.day}: ${pt.count}`}
                    >
                      <div
                        className="w-full rounded-sm bg-primary/80 min-h-[2px]"
                        style={{ height: `${(pt.count / maxDay) * 100}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-top-left whitespace-nowrap hidden sm:block">
                        {pt.day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">按模式（mode_type）</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {modes.map((m) => (
                  <li key={m.mode_type} className="flex justify-between border-b border-border/60 pb-2">
                    <span className="font-mono text-xs">{m.mode_type}</span>
                    <span className="tabular-nums">{m.count}</span>
                  </li>
                ))}
                {modes.length === 0 && <li className="text-muted-foreground">暂无数据</li>}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
