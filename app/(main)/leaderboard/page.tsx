"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, User, Trophy, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getLeaderboard } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface LeaderEntry {
  rank: number;
  username: string;
  points_balance: number;
  level: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];
const TABS = ["全局", "街景", "遥感", "地形", "混合"];

export default function LeaderboardPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    getLeaderboard({ limit: 50 })
      .then((res) => setEntries(res.leaderboard))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载排行榜失败。");
      })
      .finally(() => setLoading(false));
  }, []);

  const myEntry = useMemo(
    () => entries.find((entry) => entry.username === currentUser?.username),
    [entries, currentUser?.username]
  );

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <Trophy size={14} />
            地衡榜单
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">排行榜</h1>
          <p className="mt-2 text-slate-500 leading-relaxed">
            与全站贡献者一较高下。{myEntry ? `您当前排名第 ${myEntry.rank} 位。` : "快去完成识图或寻境任务，进入榜单吧！"}
          </p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <Card className="border-none shadow-2xl overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_120px] bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
          <span>排名</span>
          <span>贡献者</span>
          <span className="text-right">总积分</span>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab !== TABS[0] ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-slate-400"
              >
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                  <Medal size={32} />
                </div>
                <p className="text-sm font-bold">该分栏将在后续版本接入</p>
              </motion.div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold">正在同步全站数据...</p>
              </div>
            ) : error ? (
              <div className="py-24 text-center text-red-500 font-bold">{error}</div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="divide-y divide-slate-50"
              >
                {entries.map((entry, index) => {
                  const isMe = entry.username === currentUser?.username;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={entry.rank}
                      className={cn(
                        "grid grid-cols-[80px_1fr_120px] items-center px-6 py-4 transition-colors",
                        isMe ? "bg-sky-50/50" : "hover:bg-slate-50/30"
                      )}
                    >
                      <div className="flex justify-center md:justify-start">
                        {entry.rank <= 3 ? (
                          <span className="text-2xl drop-shadow-sm">{RANK_ICONS[entry.rank - 1]}</span>
                        ) : (
                          <span className="text-slate-400 font-black text-sm">#{entry.rank}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border border-white transition-transform hover:scale-110",
                          isMe ? "bg-primary text-white" : "bg-white text-slate-400"
                        )}>
                          <User size={18} />
                        </div>
                        <div>
                          <p className={cn("font-bold text-sm", isMe ? "text-primary" : "text-slate-800")}>
                            {entry.username}
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">LV. {entry.level}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900 tabular-nums">
                          {entry.points_balance.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
