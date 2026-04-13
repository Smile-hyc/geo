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
    if (!hydrated || (!user?.uid && !user?.email)) {
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
  const maxMode = modes.reduce((m, x) => Math.max(m, x.count), 0) || 1;
  const maxQuality = summary?.by_quality?.reduce((m, x) => Math.max(m, x.count), 0) || 1;

  // 状态颜色与文案映射
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved": return { label: "已通过", color: "bg-[#00B42A]" };
      case "rejected": return { label: "已拒绝", color: "bg-[#F53F3F]" };
      case "pending": return { label: "待审核", color: "bg-[#FF7D00]" };
      default: return { label: status, color: "bg-[#165DFF]" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans pb-12">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* 头部标题 */}
        <div>
          <h1 className="text-[24px] font-[700] text-[#1D2129]">数据分析</h1>
        </div>

        {err && <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-[8px] border border-destructive/20">{err}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#86909C]">
            <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
          </div>
        ) : (
          <>
            {/* 上半部分：核心图表区 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 图表 1：近 30 日趋势  */}
              <Card className="lg:col-span-2 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[12px]">
                <CardHeader className="pb-0 pt-6 px-6">
                  <CardTitle className="text-[16px] font-[700] text-[#1D2129]">近 30 日任务完成趋势</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {series.length === 0 ? (
                    <p className="text-[13px] text-[#86909C] py-10 text-center">暂无序列数据</p>
                  ) : (
                    <div className="flex items-end gap-1.5 h-[260px] overflow-x-auto mt-4 pt-8 px-2 pb-2">
                      {series.map((pt) => (
                        <div key={pt.day} className="flex flex-col items-center flex-1 gap-3 group h-full justify-end min-w-[24px]">
                          
                          {/* 柱子外层容器：压缩到 80% 高度，给顶部的气泡留出绝对的空间 */}
                          <div className="relative w-full flex justify-center h-[80%] items-end">
                            
                            {/* 真实的柱子 */}
                            <div
                              className="relative w-full max-w-[24px] bg-[#165DFF]/80 group-hover:bg-[#165DFF] rounded-t-[4px] transition-all duration-300"
                              style={{ height: `${(pt.count / maxDay) * 100}%`, minHeight: '4px' }}
                            >
                              {/*改成了相对“柱子本身”定位，永远飘在柱子头顶 */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1D2129] text-white text-[12px] px-2.5 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-md flex items-center justify-center">
                                {pt.count} 条
                                {/* 下方的小倒三角箭头 */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#1D2129]" />
                              </div>
                            </div>

                          </div>
                          
                          {/* X轴标签 */}
                          <span className="text-[11px] text-[#86909C] whitespace-nowrap">
                            {pt.day.slice(5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 图表 2：审核状态分布 */}
              <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[12px]">
                <CardHeader className="pb-0 pt-6 px-6">
                  <CardTitle className="text-[16px] font-[700] text-[#1D2129]">审核状态分布</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 mt-6 space-y-5">
                  {(summary?.by_quality || []).map((row) => {
                    const { label, color } = getStatusConfig(row.quality_status);
                    const pct = (row.count / maxQuality) * 100;
                    return (
                      <div key={row.quality_status} className="space-y-2">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-[#4E5969]">{label}</span>
                          <span className="font-[600] text-[#1D2129]">{row.count.toLocaleString()}</span>
                        </div>
                        <div className="h-[8px] w-full bg-[#F2F3F5] rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {!(summary?.by_quality?.length) && <p className="text-[13px] text-[#86909C] py-4 text-center">暂无数据</p>}
                </CardContent>
              </Card>

              {/* 图表 3：标注模式统计 */}
              <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[12px]">
                <CardHeader className="pb-0 pt-6 px-6">
                  <CardTitle className="text-[16px] font-[700] text-[#1D2129]">标注类型统计</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 mt-6 space-y-5">
                  {modes.map((m) => {
                    const pct = (m.count / maxMode) * 100;
                    return (
                      <div key={m.mode_type} className="space-y-2">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-[#4E5969] capitalize">{m.mode_type}</span>
                          <span className="font-[600] text-[#1D2129]">{m.count.toLocaleString()}</span>
                        </div>
                        <div className="h-[8px] w-full bg-[#F2F3F5] rounded-full overflow-hidden">
                          <div className="h-full bg-[#722ED1] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {modes.length === 0 && <p className="text-[13px] text-[#86909C] py-4 text-center">暂无数据</p>}
                </CardContent>
              </Card>

            </div>

            {/* 下半部分：实时数据概览 */}
            <div className="space-y-4 pt-4">
              <h2 className="text-[18px] font-[700] text-[#1D2129]">实时数据概览</h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white border border-[#E5E6EB] rounded-[8px] p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[32px] font-[700] text-[#165DFF]">
                    {summary?.total_users?.toLocaleString() ?? "—"}
                  </span>
                  <span className="text-[13px] text-[#86909C] mt-1 font-[500]">总用户数</span>
                </div>

                <div className="bg-white border border-[#E5E6EB] rounded-[8px] p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[32px] font-[700] text-[#00B42A]">
                    {summary?.total_images?.toLocaleString() ?? "—"}
                  </span>
                  <span className="text-[13px] text-[#86909C] mt-1 font-[500]">题目图总数</span>
                </div>

                <div className="bg-white border border-[#E5E6EB] rounded-[8px] p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[32px] font-[700] text-[#722ED1]">
                    {summary?.total_annotations?.toLocaleString() ?? "—"}
                  </span>
                  <span className="text-[13px] text-[#86909C] mt-1 font-[500]">总标注记录</span>
                </div>

                <div className="bg-white border border-[#E5E6EB] rounded-[8px] p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[32px] font-[700] text-[#FF7D00]">
                    {summary?.pending_reviews?.toLocaleString() ?? "—"}
                  </span>
                  <span className="text-[13px] text-[#86909C] mt-1 font-[500]">待审核任务</span>
                </div>

              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}