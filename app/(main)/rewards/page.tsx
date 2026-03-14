"use client";

import { useEffect, useState } from "react";
import { Gift, Coins, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载奖品失败");
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
      setError("请先登录");
      return;
    }
    if ((currentUser?.points_balance ?? 0) < prize.points_cost) {
      setError(`积分不足，需要 ${prize.points_cost} 积分`);
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
      setError(null);
      alert(`兑换成功！已扣除 ${res.points_spent} 积分，剩余 ${res.balance_after} 积分。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "兑换失败");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Gift className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">积分兑换</h1>
          <p className="text-sm text-muted-foreground">用积分兑换心仪奖品</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <Coins className="h-5 w-5 text-amber-500" />
        <span className="text-sm text-muted-foreground">当前积分：</span>
        <span className="font-bold text-amber-500">{user?.points_balance ?? 0}</span>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && prizes.length === 0 && !error && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无可兑换奖品</p>
            <p className="text-xs mt-1">管理员添加奖品后将在此展示</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes.map((prize) => (
          <Card key={prize.id} className="overflow-hidden flex flex-col">
            <div className="aspect-video bg-accent/20 flex items-center justify-center overflow-hidden">
              {prize.image_url ? (
                <img
                  src={prize.image_url}
                  alt={prize.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Gift className="h-16 w-16 text-muted-foreground/40" />
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{prize.name}</CardTitle>
              {prize.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{prize.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0 mt-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold">{prize.points_cost}</span>
                  <span className="text-xs text-muted-foreground">积分</span>
                </div>
                <span className="text-xs text-muted-foreground">库存 {prize.stock}</span>
              </div>
              <Button
                className="w-full mt-3"
                size="sm"
                onClick={() => handleRedeem(prize)}
                disabled={
                  redeeming !== null ||
                  (user?.points_balance ?? 0) < prize.points_cost ||
                  prize.stock <= 0
                }
              >
                {redeeming === prize.id ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />兑换中…</>
                ) : (user?.points_balance ?? 0) < prize.points_cost ? (
                  "积分不足"
                ) : prize.stock <= 0 ? (
                  "已兑完"
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
