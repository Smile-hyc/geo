"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminListRedemptions } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";

const PAGE_SIZE = 30;

export default function AdminRedemptionsPage() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<
    Array<{
      id: number;
      username: string;
      email: string;
      prize_name: string;
      prize_removed: boolean;
      points_spent: number;
      created_at: string;
    }>
  >([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListRedemptions({
        limit: PAGE_SIZE,
        offset,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      setRows(res.redemptions ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const pageEnd = Math.min(offset + rows.length, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/rewards" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回奖品
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">兑换记录</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全站用户积分兑换历史，共 {total} 条
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">暂无兑换记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">时间</th>
                    <th className="pb-2 pr-4 font-medium">用户</th>
                    <th className="pb-2 pr-4 font-medium">邮箱</th>
                    <th className="pb-2 pr-4 font-medium">奖品</th>
                    <th className="pb-2 pr-4 font-medium">消耗积分</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-4">{r.username || "—"}</td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">{r.email || "—"}</td>
                      <td className="py-2 pr-4">
                        <span>{r.prize_name || "—"}</span>
                        {r.prize_removed && (
                          <span className="ml-2 text-xs text-muted-foreground">（奖品已移除）</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{r.points_spent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {offset + 1}–{pageEnd} / {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
