"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  Gift,
  MapPin,
  ShieldCheck,
  Swords,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";

const ENTRY_CARDS = [
  {
    id: "annotate",
    href: "/app/annotate/mode",
    icon: <MapPin className="h-8 w-8 text-blue-500" />,
    title: "标注任务",
    description:
      "选择数据采集模式，并决定采集思维链、地理元素框，或两者同时采集。",
  },
  {
    id: "battle",
    href: "/app/battle",
    icon: <Swords className="h-8 w-8 text-rose-500" />,
    title: "AI 对战",
    description:
      "配置限时回合、选择 AI 对手，并逐轮比较得分表现。",
  },
  {
    id: "rewards",
    href: "/app/rewards",
    icon: <Gift className="h-8 w-8 text-amber-500" />,
    title: "奖励中心",
    description:
      "使用积分兑换奖品，并查看当前可用的奖励库存。",
  },
  {
    id: "leaderboard",
    href: "/app/leaderboard",
    icon: <Trophy className="h-8 w-8 text-emerald-500" />,
    title: "排行榜",
    description:
      "查看当前高分用户，并为后续更丰富的统计入口预留位置。",
  },
  {
    id: "history",
    href: "/app/history",
    icon: <Clock className="h-8 w-8 text-violet-500" />,
    title: "历史记录",
    description:
      "回顾你的历史标注、对战记录和当前采集状态。",
  },
  {
    id: "wiki",
    href: "/wiki",
    icon: <BookOpen className="h-8 w-8 text-sky-500" />,
    title: "公开 Wiki",
    description:
      "查看入门与科研文档，而不混入主应用操作壳层。",
  },
] as const;

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <section className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#ffffff,#eef6ff_58%,#f6fbff)] px-6 py-8 text-slate-900 shadow-lg shadow-sky-900/5">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
          核心应用
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          欢迎回来，{user?.username ?? "探索者"}。
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          平台现在按照需求文档重组，围绕数据采集、AI 对战、用户成长和研究管理流程展开。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="rounded-full border border-sky-100 bg-white px-4 py-1.5 text-slate-700">
            等级 {user?.level ?? 1}
          </div>
          <div className="rounded-full border border-sky-100 bg-white px-4 py-1.5 text-slate-700">
            {user?.points_balance ?? 0} 积分
          </div>
          <div className="rounded-full border border-sky-100 bg-white px-4 py-1.5 text-slate-700">
            角色：{user?.role === "admin" ? "管理员" : "用户"}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENTRY_CARDS.map((card) => (
          <Link key={card.id} href={card.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/50">
                  {card.icon}
                </div>
                <div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {card.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/app/annotate/mode">开始标注</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/battle">开始对战</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/app/profile">打开个人中心</Link>
        </Button>
        {user?.role === "admin" ? (
          <Button asChild variant="secondary">
            <Link href="/admin" className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              管理后台
            </Link>
          </Button>
        ) : null}
      </section>
    </div>
  );
}
