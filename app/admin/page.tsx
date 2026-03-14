"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, ClipboardList, Users, Database, Gift } from "lucide-react";
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

  useEffect(() => {
    callFunction<DashboardStats>("get-admin-stats", {})
      .then(setStats)
      .catch(() => setStats({ total_users: 0, total_images: 0, total_annotations: 0, pending_reviews: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "注册用户", value: stats?.total_users ?? 0, icon: <Users className="h-5 w-5 text-blue-400" />, href: null },
    { label: "图片总数", value: stats?.total_images ?? 0, icon: <ImageIcon className="h-5 w-5 text-green-400" />, href: "/admin/images" },
    { label: "标注记录", value: stats?.total_annotations ?? 0, icon: <Database className="h-5 w-5 text-purple-400" />, href: "/admin/reviews" },
    { label: "待审核", value: stats?.pending_reviews ?? 0, icon: <ClipboardList className="h-5 w-5 text-yellow-400" />, href: "/admin/reviews" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground text-sm mt-1">系统概览</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className={card.href ? "hover:border-primary/50 transition-colors" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {card.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">
                    {loading ? "—" : card.value.toLocaleString()}
                  </p>
                </div>
              </div>
              {card.href && (
                <Link href={card.href} className="text-xs text-primary hover:underline mt-2 block">
                  查看详情 →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/images">
                <ImageIcon className="h-4 w-4 mr-2" /> 上传新图片
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/reviews">
                <ClipboardList className="h-4 w-4 mr-2" /> 审核标注
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/prizes">
                <Gift className="h-4 w-4 mr-2" /> 添加奖品
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/tasks">
                <Database className="h-4 w-4 mr-2" /> 任务配置
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
