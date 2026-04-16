"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Gift, Loader2, ShoppingBag, ArrowRight, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { listPrizes, redeemPrize } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Prize {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  stock: number;
  image_url: string | null;
}

export default function RewardsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPrizes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPrizes();
      setPrizes(res.prizes ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载奖励列表失败。");
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrizes();
  }, []);

  const handleRedeem = async (prize: Prize) => {
    const currentUser = useAuthStore.getState().user;
    const uid = currentUser?.uid ?? "";
    const email = currentUser?.email ?? "";

    if (!uid && !email) {
      setError("请先登录。");
      return;
    }
    if ((currentUser?.points_balance ?? 0) < prize.points_cost) {
      setError(`积分不足，至少需要 ${prize.points_cost} 积分。`);
      return;
    }

    setRedeeming(prize.id);
    setError(null);
    try {
      const res = await redeemPrize({
        prize_id: prize.id,
        cloudbase_uid: uid,
        email,
      });
      setUser({
        ...currentUser!,
        points_balance: res.balance_after,
      });
      await loadPrizes();
      alert(`已兑换“${prize.name}”，消耗 ${res.points_spent} 积分，剩余 ${res.balance_after} 积分。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "兑换失败。");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto space-y-12">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <Gift size={14} />
            积分商城
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">专属奖励</h1>
          <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
            您的每一份贡献都转化为实实在在的奖励。浏览我们的精选礼品库，使用您的积分进行兑换。
          </p>
        </div>

        <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-blue-600 text-white p-6 rounded-[2.5rem] md:min-w-[240px]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">当前可用积分</span>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-black leading-none">{user?.points_balance ?? 0}</span>
              <Coins size={24} className="mb-1" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
               <Link href="/app/points" className="text-xs font-bold flex items-center gap-1 hover:underline">
                  查看流水详情 <ArrowRight size={12} />
               </Link>
            </div>
          </div>
        </Card>
      </section>

      {error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
          <Zap size={18} />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold">正在同步奖励库存...</p>
        </div>
      ) : null}

      {!loading && prizes.length === 0 && !error ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent">
          <CardContent className="py-24 text-center text-slate-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-lg font-bold">货架暂时空空如也</p>
            <p className="text-sm">管理员正在快马加鞭上架新奖品</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            key={prize.id}
          >
            <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group rounded-[2.5rem]">
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                {prize.image_url ? (
                  <img 
                    src={prize.image_url} 
                    alt={prize.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Gift size={64} className="opacity-20 transition-transform group-hover:scale-125 duration-500" />
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-primary text-xs font-black">
                  库存 {prize.stock}
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">{prize.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-slate-500 text-sm leading-relaxed">
                  {prize.description || "暂无详细描述，这是一个神秘的惊喜奖项。"}
                </CardDescription>
              </CardHeader>

              <CardFooter className="flex flex-col gap-4 pt-4">
                <div className="w-full flex items-center justify-between px-1">
                   <div className="flex items-center gap-1.5 text-amber-600">
                      <Coins size={18} />
                      <span className="text-xl font-black tabular-nums">{prize.points_cost}</span>
                      <span className="text-[10px] font-black uppercase tracking-tighter mt-1">PTS</span>
                   </div>
                </div>

                <Button
                  className={cn(
                    "w-full h-12 rounded-2xl text-base font-bold transition-all",
                    (user?.points_balance ?? 0) >= prize.points_cost && prize.stock > 0
                      ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                  onClick={() => handleRedeem(prize)}
                  disabled={
                    redeeming !== null ||
                    (user?.points_balance ?? 0) < prize.points_cost ||
                    prize.stock <= 0
                  }
                >
                  {redeeming === prize.id ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (user?.points_balance ?? 0) < prize.points_cost ? (
                    "积分不足"
                  ) : prize.stock <= 0 ? (
                    "已售罄"
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2" />
                      立即兑换
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
