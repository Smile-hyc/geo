"use client";

import { useEffect, useState } from "react";
import { Coins, Gift, Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPrizes, redeemPrize } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

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
    <div className="space-y-4">
      <section className="wg-panel p-5">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#b2cfbb]" />
          <h1 className="text-xl font-semibold text-[#f2fff5]">积分奖励</h1>
        </div>
        <p className="mt-1 text-sm text-[#c1d6c8]">使用积分兑换可用奖品</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#3d634c] bg-[rgba(17,35,24,0.82)] px-3 py-2 text-sm text-[#deefe4]">
          <Coins className="h-4 w-4" />
          当前余额：<span className="font-semibold">{user?.points_balance ?? 0}</span>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#d9eddf]" />
        </div>
      ) : null}

      {!loading && prizes.length === 0 && !error ? (
        <Card>
          <CardContent className="py-12 text-center text-[#bfd4c6]">
            <ShoppingBag className="mx-auto mb-2 h-8 w-8 opacity-80" />
            暂无可兑换奖励。
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize) => (
          <Card key={prize.id} className="overflow-hidden">
            <div className="aspect-video border-b border-[#2f4c3a] bg-[rgba(13,25,18,0.82)]">
              {prize.image_url ? (
                <img src={prize.image_url} alt={prize.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Gift className="h-10 w-10 text-[#8db09a]" />
                </div>
              )}
            </div>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-sm font-semibold text-[#f2fff5]">{prize.name}</p>
                {prize.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[#bad2c2]">{prize.description}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#d6e9dc]">{prize.points_cost} 积分</span>
                <span className="text-[#9eb8a9]">库存 {prize.stock}</span>
              </div>

              <Button
                className="w-full"
                size="sm"
                onClick={() => handleRedeem(prize)}
                disabled={
                  redeeming !== null ||
                  (user?.points_balance ?? 0) < prize.points_cost ||
                  prize.stock <= 0
                }
              >
                {redeeming === prize.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    兑换中
                  </>
                ) : (user?.points_balance ?? 0) < prize.points_cost ? (
                  "积分不足"
                ) : prize.stock <= 0 ? (
                  "库存不足"
                ) : (
                  "立即兑换"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
