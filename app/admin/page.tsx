"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Image as ImageIcon, 
  ClipboardList, 
  Users, 
  Database, 
  Gift, 
  Download,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { callFunction } from "@/lib/cloudbase";

interface DashboardStats {
  total_users: number;
  total_images: number;
  total_annotations: number;
  pending_reviews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 完美保留了你的业务逻辑，不动任何底层
  useEffect(() => {
    callFunction<DashboardStats>("get-admin-stats", {})
      .then(setStats)
      .catch(() => setStats({ total_users: 0, total_images: 0, total_annotations: 0, pending_reviews: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    // 使用了你设计稿中的 #F4F7FE 高级浅灰蓝背景
    <div className="min-h-screen bg-[#F4F7FE] p-6 md:p-8 font-sans">
      <div className="max-w-[1136px] mx-auto space-y-6">
        
        {/* 头部：标题与操作按钮 */}
        <div className="flex justify-between items-center">
          <h1 className="text-[24px] font-[700] text-[#1D2129]">仪表盘</h1>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 border border-[#E5E5E5] rounded-[6px] bg-white text-[14px] text-[#0A0A0A] shadow-sm">
              本月
            </div>
            {/* 生成报告按钮：主品牌色 #165DFF */}
            <Button className="bg-[#165DFF] hover:bg-[#0E42C9] text-white rounded-[4px] h-[36px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] px-4">
              <Download className="w-4 h-4 mr-2" />
              生成报告
            </Button>
          </div>
        </div>

        {/* 四大核心指标 (KPI) 卡片：精准还原设计稿色号 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 卡片 1：总注册用户 */}
          <Card className="rounded-[12px] border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-none">
            <CardContent className="p-6 space-y-2">
              <p className="text-[14px] text-[#86909C]">总注册用户数</p>
              <div className="flex justify-between items-end">
                <span className="text-[24px] font-[700] text-[#165DFF]">
                  {loading ? "..." : (stats?.total_users?.toLocaleString() ?? 0)}
                </span>
              </div>
              <div className="flex items-center text-[12px] mt-2">
                <span className="text-[#22C55E] flex items-center bg-[#DCFCE7] px-1.5 py-0.5 rounded mr-2">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
                </span>
                <span className="text-[#86909C]">较上月</span>
              </div>
            </CardContent>
          </Card>

          {/* 卡片 2：累计图片 */}
          <Card className="rounded-[12px] border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-none">
            <CardContent className="p-6 space-y-2">
              <p className="text-[14px] text-[#86909C]">累计图片资源量</p>
              <div className="flex justify-between items-end">
                <span className="text-[24px] font-[700] text-[#52C41A]">
                  {loading ? "..." : (stats?.total_images?.toLocaleString() ?? 0)}
                </span>
              </div>
              <div className="flex items-center text-[12px] mt-2">
                <span className="text-[#22C55E] flex items-center bg-[#DCFCE7] px-1.5 py-0.5 rounded mr-2">
                  <TrendingUp className="w-3 h-3 mr-1" /> +8.3%
                </span>
                <span className="text-[#86909C]">较上月</span>
              </div>
            </CardContent>
          </Card>

          {/* 卡片 3：累计标注量 (映射 AI对战位) */}
          <Card className="rounded-[12px] border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-none">
            <CardContent className="p-6 space-y-2">
              <p className="text-[14px] text-[#86909C]">累计标注数量</p>
              <div className="flex justify-between items-end">
                <span className="text-[24px] font-[700] text-[#722ED1]">
                  {loading ? "..." : (stats?.total_annotations?.toLocaleString() ?? 0)}
                </span>
              </div>
              <div className="flex items-center text-[12px] mt-2">
                <span className="text-[#EF4444] flex items-center bg-[#FEE2E2] px-1.5 py-0.5 rounded mr-2">
                  <TrendingDown className="w-3 h-3 mr-1" /> -2.1%
                </span>
                <span className="text-[#86909C]">较上月</span>
              </div>
            </CardContent>
          </Card>

          {/* 卡片 4：待审核项 */}
          <Card className="rounded-[12px] border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-none">
            <CardContent className="p-6 space-y-2">
              <p className="text-[14px] text-[#86909C]">待处理审核项</p>
              <div className="flex justify-between items-end">
                <span className="text-[24px] font-[700] text-[#FAAD14]">
                  {loading ? "..." : (stats?.pending_reviews?.toLocaleString() ?? 0)}
                </span>
              </div>
              <div className="flex items-center text-[12px] mt-2 text-[#86909C]">
                需尽快处理
              </div>
            </CardContent>
          </Card>

        </div>

        {/* 占位：图表区域 (基于你导出的图片区域预留) */}
        <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <CardContent className="p-0 h-[400px] flex items-center justify-center bg-white relative">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
             <div className="text-center z-10 space-y-3">
                <Activity className="w-12 h-12 text-[#165DFF] mx-auto opacity-50" />
                <p className="text-[#86909C] font-medium">数据趋势图表区 (预留)</p>
             </div>
          </CardContent>
        </Card>

        {/* 底部功能区：最新任务 + 快速操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧宽区域：最新标注任务列表 (静态展示，还原设计) */}
          <Card className="lg:col-span-2 rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[20px] font-[700] text-[#1D2129]">最新标注任务</CardTitle>
              <Button variant="ghost" className="text-[#1D2129] font-[500] hover:bg-[#F4F7FE]">查看全部</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-transparent border-b border-[#F9FAFB] text-[#86909C]">
                    <tr>
                      <th className="px-6 py-4 font-[500]">任务编号</th>
                      <th className="px-6 py-4 font-[500]">玩家信息</th>
                      <th className="px-6 py-4 font-[500]">图片区域</th>
                      <th className="px-6 py-4 font-[500]">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9FAFB]">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#4E5969] font-medium">TSK-2024-001</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F4F7FE] text-[#1E40AF] flex items-center justify-center font-semibold">AJ</div>
                          <span className="text-[#1D2129] font-medium">Alex Johnson</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#4E5969]">北京市朝阳区</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-[6px] bg-[#DCFCE7] text-[#166534] text-[12px] font-[600]">已完成</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#4E5969] font-medium">TSK-2024-002</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F4F7FE] text-[#1E40AF] flex items-center justify-center font-semibold">MG</div>
                          <span className="text-[#1D2129] font-medium">Maria Garcia</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#4E5969]">上海市浦东新区</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-[6px] bg-[#FEF9C3] text-[#854D0E] text-[12px] font-[600]">待处理</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 右侧窄区域：整合你的“快速操作”代码 */}
          <Card className="rounded-[12px] border-none shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[20px] font-[700] text-[#1D2129]">快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#F9FAFB] shadow-sm hover:bg-gray-50 text-[#1D2129]" asChild>
                <Link href="/admin/images">
                  <ImageIcon className="h-4 w-4 mr-3 text-[#165DFF]" /> 上传新图片
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#F9FAFB] shadow-sm hover:bg-gray-50 text-[#1D2129]" asChild>
                <Link href="/admin/reviews">
                  <ClipboardList className="h-4 w-4 mr-3 text-[#165DFF]" /> 审核标注
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#F9FAFB] shadow-sm hover:bg-gray-50 text-[#1D2129]" asChild>
                <Link href="/admin/rewards">
                  <Gift className="h-4 w-4 mr-3 text-[#165DFF]" /> 添加奖品
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-[48px] border-[#F9FAFB] shadow-sm hover:bg-gray-50 text-[#1D2129]" asChild>
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