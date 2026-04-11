"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Image as ImageIcon, 
  ClipboardList, 
  Users, 
  Database, 
  Gift, 
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { callFunction, listSubmissions } from "@/lib/cloudbase";
// 🟢 1. 引入了 Auth 状态
import { useAuthStore } from "@/lib/auth";

interface DashboardStats {
  total_users: number;
  total_images: number;
  total_annotations: number;
  pending_reviews: number;
}

export default function AdminDashboard() {
  // 🟢 2. 获取当前登录的用户信息
  const user = useAuthStore((s) => s.user);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    // 获取总览统计数据
    callFunction<DashboardStats>("get-admin-stats", {})
      .then(setStats)
      .catch(() => setStats({ total_users: 0, total_images: 0, total_annotations: 0, pending_reviews: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // 🟢 3. 如果 user 还没加载出来，先不请求
    if (!user) return;

    // 获取最新标注任务，老老实实带上管理员身份凭证
    setLoadingTasks(true);
    listSubmissions({ 
      limit: 5,
      cloudbase_uid: user.uid,   // 👈 就是缺了这两行！
      email: user.email          // 👈 没这两行后端不给你数据
    })
      .then((res: any) => {
        setRecentTasks(res.submissions || []);
      })
      .catch((e) => {
        console.error("加载最新任务失败:", e);
        setRecentTasks([]);
      })
      .finally(() => setLoadingTasks(false));
  }, [user]); // 依赖项加上 user

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1136px] mx-auto space-y-6">
        
        {/* 头部：标题与操作按钮 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[24px] font-[700] text-[#1D2129]">仪表盘</h1>
            <p className="text-muted-foreground text-sm mt-1">系统概览</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 border border-[#E5E5E5] rounded-[6px] bg-white text-[14px] text-[#0A0A0A] shadow-sm">
              本月
            </div>
          </div>
        </div>

        {/* 四大核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#165DFF]/30 transition-colors border border-transparent group">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#165DFF]" />
                  <p className="text-[14px] text-[#86909C]">注册用户</p>
                </div>
                <div className="text-[24px] font-[700] text-[#165DFF]">
                  {loading ? "..." : (stats?.total_users?.toLocaleString() ?? 0)}
                </div>
              </div>
              <div className="flex items-center justify-end text-[12px] mt-4 min-h-[20px]">
                <Link href="/admin/users" className="text-[#165DFF] font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  查看详情 →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#165DFF]/30 transition-colors border border-transparent group">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#00B42A]" />
                  <p className="text-[14px] text-[#86909C]">图片总数</p>
                </div>
                <div className="text-[24px] font-[700] text-[#00B42A]">
                  {loading ? "..." : (stats?.total_images?.toLocaleString() ?? 0)}
                </div>
              </div>
              <div className="flex items-center justify-end text-[12px] mt-4 min-h-[20px]">
                <Link href="/admin/users" className="text-[#165DFF] font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  查看详情 →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#165DFF]/30 transition-colors border border-transparent group">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#722ED1]" />
                  <p className="text-[14px] text-[#86909C]">标注记录</p>
                </div>
                <div className="text-[24px] font-[700] text-[#722ED1]">
                  {loading ? "..." : (stats?.total_annotations?.toLocaleString() ?? 0)}
                </div>
              </div>
              <div className="flex items-center justify-end text-[12px] mt-4 min-h-[20px]">
                <Link href="/admin/users" className="text-[#165DFF] font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  查看详情 →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#165DFF]/30 transition-colors border border-transparent group">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#FF7D00]" />
                  <p className="text-[14px] text-[#86909C]">待审核</p>
                </div>
                <div className="text-[24px] font-[700] text-[#FF7D00]">
                  {loading ? "..." : (stats?.pending_reviews?.toLocaleString() ?? 0)}
                </div>
              </div>
              <div className="flex items-center justify-between text-[12px] mt-4 text-[#86909C]">
                <span>需尽快处理</span>
                <Link href="/admin/reviews" className="text-[#165DFF] font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  处理审核 →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部功能区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[20px] font-[700] text-[#1D2129]">最新标注任务</CardTitle>
              <Button variant="ghost" className="text-[#1D2129] font-[500] hover:bg-[#F4F7FE]" asChild>
                <Link href="/admin/reviews">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-transparent border-b border-[#F9FAFB] text-[#86909C]">
                    <tr>
                      <th className="px-6 py-4 font-[500]">任务编号</th>
                      <th className="px-6 py-4 font-[500]">玩家信息</th>
                      <th className="px-6 py-4 font-[500]">图片区域 (答案)</th>
                      <th className="px-6 py-4 font-[500]">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9FAFB]">
                    {loadingTasks ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#86909C]">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-[#165DFF]" />
                          正在加载最新任务...
                        </td>
                      </tr>
                    ) : recentTasks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#86909C]">
                          暂无最新标注任务
                        </td>
                      </tr>
                    ) : (
                      recentTasks.map((task, index) => {
                        const rawId = String(task.id || task._id || index);
                        const displayId = rawId.length > 10 ? `TSK-${rawId.slice(-6).toUpperCase()}` : `TSK-${rawId}`;
                        const userStr = task.username || task.email || "匿名用户";
                        const initials = userStr.substring(0, 2).toUpperCase();
                        // 优先显示玩家真实提交的答案，没有答案就显示模式
                        const location = task.final_answer || task.mode_type || "未知";
                        const status = task.quality_status || "pending";

                        return (
                          <tr key={rawId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-[#4E5969] font-medium">{displayId}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#F4F7FE] text-[#165DFF] flex items-center justify-center font-semibold text-[12px] shrink-0">
                                  {initials}
                                </div>
                                <span className="text-[#1D2129] font-medium truncate max-w-[120px]" title={userStr}>
                                  {userStr.split('@')[0]}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#4E5969] truncate max-w-[150px]" title={location}>
                              {location}
                            </td>
                            <td className="px-6 py-4">
                              {status === "approved" ? (
                                <span className="px-2.5 py-1 rounded-[4px] bg-[#DCFCE7] text-[#166534] text-[12px] font-[600]">已通过</span>
                              ) : status === "rejected" ? (
                                <span className="px-2.5 py-1 rounded-[4px] bg-[#FEE2E2] text-[#EF4444] text-[12px] font-[600]">已拒绝</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-[4px] bg-[#FFF7E8] text-[#FF7D00] text-[12px] font-[600]">待审核</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[20px] font-[700] text-[#1D2129]">快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#E5E6EB] shadow-sm hover:bg-[#F4F7FE] hover:border-[#165DFF]/30 text-[#1D2129] transition-all" asChild>
                <Link href="/admin/images">
                  <ImageIcon className="h-4 w-4 mr-3 text-[#165DFF]" /> 上传新图片
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#E5E6EB] shadow-sm hover:bg-[#F4F7FE] hover:border-[#165DFF]/30 text-[#1D2129] transition-all" asChild>
                <Link href="/admin/reviews">
                  <ClipboardList className="h-4 w-4 mr-3 text-[#165DFF]" /> 审核标注
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#E5E6EB] shadow-sm hover:bg-[#F4F7FE] hover:border-[#165DFF]/30 text-[#1D2129] transition-all" asChild>
                <Link href="/admin/rewards">
                  <Gift className="h-4 w-4 mr-3 text-[#165DFF]" /> 添加奖品
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#E5E6EB] shadow-sm hover:bg-[#F4F7FE] hover:border-[#165DFF]/30 text-[#1D2129] transition-all" asChild>
                <Link href="/admin/tasks">
                  <Database className="h-4 w-4 mr-3 text-[#165DFF]" /> 任务配置
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}