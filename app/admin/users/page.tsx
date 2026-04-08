"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  adminListUsers,
  adminUpdateUserRole,
  adminSetUserStatus,
  adminAdjustUserPoints,
  type AdminUserRow,
} from "@/lib/cloudbase";
import { useAuthStore, useAuthStoreHydrated } from "@/lib/auth";

const ROLES = ["user", "admin", "reviewer", "researcher"] as const;

export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStoreHydrated();
  const fetchGenRef = useRef(0);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    if (!user || (!user.uid && !user.email)) {
      setLoading(false);
      setRows([]);
      setTotal(0);
      return;
    }
    const gen = ++fetchGenRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await adminListUsers({
        limit: 100,
        offset: 0,
        q: qDebounced || undefined,
        cloudbase_uid: user.uid,
        email: user.email,
      });
      if (gen !== fetchGenRef.current) return;
      setRows(res.users ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      if (gen !== fetchGenRef.current) return;
      setRows([]);
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [authHydrated, user?.uid, user?.email, qDebounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRoleChange = async (row: AdminUserRow, role: string) => {
    try {
      await adminUpdateUserRole({
        user_id: row.id,
        role,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新角色失败");
    }
  };

  const toggleStatus = async (row: AdminUserRow) => {
    const next = row.status === "suspended" ? "active" : "suspended";
    try {
      await adminSetUserStatus({
        user_id: row.id,
        status: next,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新状态失败");
    }
  };

  const adjustPoints = async (row: AdminUserRow) => {
    const raw = prompt(`调整用户 ${row.username} 的积分（正数增加，负数减少）`, "0");
    if (raw === null) return;
    const delta = parseInt(raw, 10);
    if (Number.isNaN(delta) || delta === 0) {
      alert("请输入非零整数");
      return;
    }
    try {
      await adminAdjustUserPoints({
        user_id: row.id,
        delta,
        cloudbase_uid: user?.uid,
        email: user?.email,
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "调整积分失败");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">角色、状态与积分（管理员）</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="搜索用户名或邮箱…"
            className="w-56"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading || !authHydrated || !user}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      {!authHydrated || loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">共 {total} 条</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">用户名</th>
                    <th className="py-2 pr-3">邮箱</th>
                    <th className="py-2 pr-3">角色</th>
                    <th className="py-2 pr-3">状态</th>
                    <th className="py-2 pr-3">积分</th>
                    <th className="py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-mono text-xs">{row.id}</td>
                      <td className="py-2 pr-3">{row.username}</td>
                      <td className="py-2 pr-3 max-w-[200px] truncate">{row.email}</td>
                      <td className="py-2 pr-3">
                        <select
                          className="bg-background border border-border rounded-md px-2 py-1 text-xs"
                          value={row.role}
                          onChange={(e) => void onRoleChange(row, e.target.value)}
                          disabled={!user}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            row.status === "suspended"
                              ? "text-red-400 text-xs"
                              : "text-green-400 text-xs"
                          }
                        >
                          {row.status === "suspended" ? "已暂停" : "正常"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{row.points_balance}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void toggleStatus(row)}>
                            {row.status === "suspended" ? "恢复" : "暂停"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void adjustPoints(row)}>
                            积分
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            { rows.length === 0 && (
              <p className="text-center text-muted-foreground py-8">暂无用户</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
