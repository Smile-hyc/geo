"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, TrendingDown, TrendingUp, History, Calendar } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { callFunction } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  id: number;
  change_amount: number;
  balance_after: number;
  reason_type: string;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  annotation_reward: "识图奖励",
  battle_reward: "寻境奖励",
  quality_bonus: "质量加成",
  admin_adjust: "管理员调整",
  prize_redemption: "权益兑换",
};

export default function PointsPage() {
  const user = useAuthStore((state) => state.user);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callFunction<{ entries: LedgerEntry[] }>("get-points-history", {
      cloudbase_uid: user?.uid,
      email: user?.email,
    })
      .then((res) => setEntries(res.entries ?? []))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "加载积分流水失败。");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.email]);

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-4">
          <History size={14} />
          交易明细
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">积分流水</h1>
        <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
          追踪识图任务与寻境求证带来的每一次积分变化。透明的激励机制，记录每一份有效贡献。
        </p>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold">正在提取历史记录...</p>
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
            <Coins size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold">暂无积分变动记录</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {entries.map((entry, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={entry.id}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden group">
              <CardContent className="px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                      entry.change_amount >= 0
                        ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                        : "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
                    )}>
                      {entry.change_amount >= 0 ? (
                        <TrendingUp size={22} />
                      ) : (
                        <TrendingDown size={22} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {REASON_LABELS[entry.reason_type] ?? entry.reason_type}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                        <Calendar size={12} />
                        {new Date(entry.created_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black tabular-nums",
                      entry.change_amount >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {entry.change_amount >= 0 ? "+" : ""}
                      {entry.change_amount}
                    </p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">余额 {entry.balance_after}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
