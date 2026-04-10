"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// 🟢 引入了 Search 图标
import { Loader2, RefreshCw, Search } from "lucide-react";
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
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* 1. 标题区域 */}
        <div>
          <h1 className="text-[24px] font-[700] text-[#1D2129]">用户管理</h1>
          <p className="text-[14px] text-[#86909C] mt-1">角色、状态与积分（管理员）</p>
        </div>

        {/* 2. 🟢 改造后的大型横向搜索栏 */}
        <div className="bg-white rounded-[8px] border border-[#E5E6EB] shadow-sm p-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86909C]" />
            <Input
              placeholder="搜索用户 ID、用户名或邮箱…"
              className="w-full pl-9 h-[40px] border-[#E5E6EB] focus-visible:ring-[#165DFF] text-[14px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            className="h-[40px] px-5 border-[#E5E6EB] text-[#4E5969] hover:text-[#165DFF] hover:border-[#165DFF]/50 transition-colors"
            onClick={() => void load()}
            disabled={loading || !authHydrated || !user}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            刷新数据
          </Button>
        </div>

        {/* 错误提示保留 */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">{error}</p>
        )}

        {/* 3. 🟢 表格卡片 UI 升级 */}
        {!authHydrated || loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#165DFF]" />
          </div>
        ) : (
          <Card className="rounded-[12px] border-none shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-[#F9FAFB] bg-white">
                <p className="text-[14px] font-medium text-[#86909C]">共 {total} 条记录</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4E5969]">
                    <tr>
                      <th className="px-6 py-4 font-[500]">ID</th>
                      <th className="px-6 py-4 font-[500]">用户名</th>
                      <th className="px-6 py-4 font-[500]">邮箱</th>
                      <th className="px-6 py-4 font-[500]">角色</th>
                      <th className="px-6 py-4 font-[500]">状态</th>
                      <th className="px-6 py-4 font-[500]">积分</th>
                      <th className="px-6 py-4 font-[500]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9FAFB]">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-[#86909C]">{row.id}</td>
                        <td className="px-6 py-4 font-medium text-[#1D2129]">{row.username}</td>
                        <td className="px-6 py-4 text-[#4E5969] max-w-[200px] truncate" title={row.email}>{row.email}</td>
                        <td className="px-6 py-4">
                          <select
                            className="bg-white border border-[#E5E6EB] rounded-[6px] px-3 py-1.5 text-[13px] text-[#4E5969] outline-none focus:border-[#165DFF] focus:ring-1 focus:ring-[#165DFF]/20 cursor-pointer transition-all"
                            value={row.role}
                            onChange={(e) => void onRoleChange(row, e.target.value)}
                            disabled={!user}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {row.status === "suspended" ? (
                            <span className="px-2.5 py-1 rounded-[4px] bg-[#FEE2E2] text-[#EF4444] text-[12px] font-[600]">
                              已暂停
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-[4px] bg-[#DCFCE7] text-[#166534] text-[12px] font-[600]">
                              正常
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#165DFF] font-[600]">{row.points_balance}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              className="h-[32px] px-3 text-[13px] border-[#E5E6EB] text-[#4E5969] hover:text-[#165DFF] hover:bg-[#165DFF]/5 hover:border-[#165DFF]/30 transition-all" 
                              onClick={() => void toggleStatus(row)}
                            >
                              {row.status === "suspended" ? "恢复" : "暂停"}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-[32px] px-3 text-[13px] border-[#E5E6EB] text-[#4E5969] hover:text-[#165DFF] hover:bg-[#165DFF]/5 hover:border-[#165DFF]/30 transition-all" 
                              onClick={() => void adjustPoints(row)}
                            >
                              积分
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <p className="text-center text-[#86909C] py-16">暂无用户数据</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}