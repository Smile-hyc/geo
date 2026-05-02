"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, Loader2, MapPin, Swords, Calendar, ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { callFunction } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  type: "annotation" | "battle";
  id: number;
  mode_type: string;
  created_at: string;
  annotation?: { thought_text: string; final_answer: string; quality_status: string };
  battle?: { user_total_score: number; ai_total_score: number; winner: string; round_count: number };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const STATUS_ICONS: Record<string, any> = {
  pending: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-500 bg-amber-50",
  approved: "text-emerald-500 bg-emerald-50",
  rejected: "text-rose-500 bg-rose-50",
};

export default function HistoryPage() {
  const user = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: HistoryEntry[] }>("get-user-history", {
      cloudbase_uid: user?.uid,
      email: user?.email,
    })
      .then((res) => setEntries(res.entries ?? []))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载历史记录失败。");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.email]);

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-4">
          <Clock size={14} />
          成果回顾
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">历史记录</h1>
        <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
          回顾您的识图任务历程与寻境求证表现。每一次记录，都是空间智能能力进化的证据。
        </p>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold">正在加载时光机...</p>
        </div>
      ) : null}

      {error ? (
        <div className="p-8 rounded-3xl bg-red-50 border border-red-100 text-red-600 text-center font-bold">
          {error}
        </div>
      ) : null}

      {!loading && entries.length === 0 && !error ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent">
          <CardContent className="py-20 text-center text-slate-400">
            <Calendar size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold">暂无历史记录，去开始第一次任务吧！</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.type}-${entry.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {entry.type === "battle" ? (
              <Link
                href={`/app/battle/${entry.id}/result`}
                className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`打开对局 ${entry.id} 的复盘结果`}
              >
                <Card className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden group h-full cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3",
                          "bg-indigo-50 text-indigo-600"
                        )}
                      >
                        <Swords size={24} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-slate-800">寻境对局</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                              {entry.mode_type}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(entry.created_at).toLocaleDateString("zh-CN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        {entry.battle && (
                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-400 mb-1">比分结果</span>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-500">我方</span>
                                  <span className="text-xl font-black text-primary">{entry.battle.user_total_score}</span>
                                </div>
                                <span className="text-slate-300 font-black">:</span>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-500">AI</span>
                                  <span className="text-xl font-black text-rose-500">{entry.battle.ai_total_score}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-px h-10 bg-slate-100 mx-2" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-400 mb-1">胜负</span>
                              <span
                                className={cn(
                                  "text-lg font-black",
                                  entry.battle.winner === "user"
                                    ? "text-emerald-500"
                                    : entry.battle.winner === "draw"
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                )}
                              >
                                {entry.battle.winner === "user"
                                  ? "VICTORY"
                                  : entry.battle.winner === "draw"
                                    ? "DRAW"
                                    : "DEFEAT"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end md:ml-4">
                        <ArrowRight
                          size={20}
                          className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3",
                        "bg-sky-50 text-sky-600"
                      )}
                    >
                      <MapPin size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-800">识图任务</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                            {entry.mode_type}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(entry.created_at).toLocaleDateString("zh-CN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {entry.annotation && (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-500 italic line-clamp-1 leading-relaxed">
                            &quot;{entry.annotation.thought_text || "无推理记录"}&quot;
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">最终答案:</span>
                              <span className="text-sm font-black text-slate-700">{entry.annotation.final_answer || "-"}</span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                                STATUS_COLORS[entry.annotation.quality_status]
                              )}
                            >
                              {(() => {
                                const Icon = STATUS_ICONS[entry.annotation.quality_status] || AlertCircle;
                                return <Icon size={14} />;
                              })()}
                              {STATUS_LABELS[entry.annotation.quality_status] || "未知"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end md:ml-4">
                      <ArrowRight
                        size={20}
                        className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
