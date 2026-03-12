"use client";

import Link from "next/link";
import { MapPin, Swords, Trophy, Clock, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";

const MODES = [
  {
    id: "annotate",
    href: "/annotate",
    icon: <MapPin className="h-8 w-8 text-blue-400" />,
    title: "标注任务",
    description: "对地理图片进行 BBox 标注和思维链分析，收集训练数据",
    badge: "每次 +50 积分",
    badgeColor: "bg-blue-500/20 text-blue-400",
    difficulty: "★★★",
  },
  {
    id: "battle",
    href: "/battle",
    icon: <Swords className="h-8 w-8 text-red-400" />,
    title: "AI 对战",
    description: "与 AI 模型在限时内猜测地理位置，比拼地理直觉",
    badge: "胜利 +200 积分",
    badgeColor: "bg-red-500/20 text-red-400",
    difficulty: "★★★★",
  },
  {
    id: "leaderboard",
    href: "/leaderboard",
    icon: <Trophy className="h-8 w-8 text-yellow-400" />,
    title: "排行榜",
    description: "查看全球玩家积分排名，挑战登顶",
    badge: "实时更新",
    badgeColor: "bg-yellow-500/20 text-yellow-400",
    difficulty: null,
  },
  {
    id: "history",
    href: "/history",
    icon: <Clock className="h-8 w-8 text-purple-400" />,
    title: "历史记录",
    description: "回顾你的标注记录和对战历史",
    badge: "全部记录",
    badgeColor: "bg-purple-500/20 text-purple-400",
    difficulty: null,
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">
          欢迎回来，{user?.username ?? "探索者"} 👋
        </h1>
        <p className="text-muted-foreground">
          选择一个模式开始你的地理探索之旅
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-accent/50 rounded-full px-4 py-1.5 text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Lv.{user?.level ?? 1}</span>
          </div>
          <div className="flex items-center gap-2 bg-accent/50 rounded-full px-4 py-1.5 text-sm">
            <span className="text-yellow-500">✦</span>
            <span>{user?.points_balance ?? 0} 积分</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map((mode) => (
          <Link key={mode.id} href={mode.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-accent/50 group-hover:bg-accent transition-colors">
                    {mode.icon}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${mode.badgeColor}`}>
                    {mode.badge}
                  </span>
                </div>
                <CardTitle className="mt-3">{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              {mode.difficulty && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>难度：</span>
                    <span className="text-yellow-500">{mode.difficulty}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/profile">查看我的主页 →</Link>
        </Button>
      </div>
    </div>
  );
}
