"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth";

type EntryCard = {
  id: string;
  href: string;
  title: string;
  description: string;
  iconBg: string;
  iconText: string;
  hoverBg: string;
  icon: React.ReactNode;
};

const ENTRY_CARDS: EntryCard[] = [
  {
    id: "annotate",
    href: "/app/annotate/mode",
    title: "标注任务",
    description: "选择数据采集模式，并决定采集思维链、地理元素框，或两者同时采集。",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    hoverBg: "group-hover:bg-blue-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
  {
    id: "battle",
    href: "/app/battle",
    title: "AI 对战",
    description: "配置限时回合、选择 AI 对手，并逐轮比较得分表现。",
    iconBg: "bg-rose-50",
    iconText: "text-rose-500",
    hoverBg: "group-hover:bg-rose-500",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18.5 5.5L5.5 18.5" />
        <path d="M4.5 15.5l4 4" />
        <path d="M3.5 20.5l2-2" />
        <path d="M5.5 5.5l13 13" />
        <path d="M15.5 19.5l4-4" />
        <path d="M18.5 18.5l2 2" />
      </svg>
    ),
  },
  {
    id: "rewards",
    href: "/app/rewards",
    title: "奖励中心",
    description: "使用积分兑换奖品，并查看当前可用的奖励库存。",
    iconBg: "bg-amber-50",
    iconText: "text-amber-500",
    hoverBg: "group-hover:bg-amber-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="8" width="18" height="14" rx="2" ry="2" />
        <path d="M12 8V22" />
        <path d="M3 12h18" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5H12z" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    href: "/app/leaderboard",
    title: "排行榜",
    description: "查看当前高分用户，并为后续更丰富的统计入口预留位置。",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-500",
    hoverBg: "group-hover:bg-emerald-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    id: "history",
    href: "/app/history",
    title: "历史记录",
    description: "回顾你的历史标注、对战记录和当前采集状态。",
    iconBg: "bg-violet-50",
    iconText: "text-violet-500",
    hoverBg: "group-hover:bg-violet-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "wiki",
    href: "/wiki",
    title: "公开 Wiki",
    description: "查看入门与科研文档，而不混入主应用操作壳层。",
    iconBg: "bg-sky-50",
    iconText: "text-sky-500",
    hoverBg: "group-hover:bg-sky-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6s3-1 10-1 10 1 10 1v12s-3-1-10-1-10 1-10 1V6z" />
        <line x1="12" y1="5" x2="12" y2="18" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  // 统一样式类名：初始浅色边框，选中变蓝
  const buttonStyle = "rounded-2xl border-2 border-gray-300 bg-white px-10 py-3.5 text-sm font-bold text-gray-700 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-blue-200 active:scale-95";

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden px-6 py-4 md:px-16 lg:px-24">
      <main className="flex flex-1 flex-col justify-center overflow-hidden">
        <section className="relative mb-6 shrink-0 overflow-hidden rounded-[40px] border border-gray-300 bg-white/70 p-8 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04),0_8px_15px_-6px_rgba(0,0,0,0.04)] backdrop-blur-xl md:p-10">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/50 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-80">CORE APPLICATION</p>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-800 md:text-4xl">欢迎回来，{user?.username ?? "Smile"}。</h1>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-gray-500 md:text-base">
              平台现在按照需求文档重组，围绕数据采集、AI 对战、用户成长和研究管理流程展开。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-2xl border border-gray-100 bg-white/80 px-5 py-2 text-[11px] font-semibold text-gray-500 shadow-sm">等级 {user?.level ?? 1}</span>
              <span className="rounded-2xl border border-gray-100 bg-white/80 px-5 py-2 text-[11px] font-semibold text-gray-500 shadow-sm">{user?.points_balance ?? 0} 积分</span>
              <span className="rounded-2xl border border-gray-100 bg-white/80 px-5 py-2 text-[11px] font-semibold text-gray-500 shadow-sm">角色：{user?.role === "admin" ? "管理员" : "用户"}</span>
            </div>
          </div>
        </section>

        <section className="mb-8 grid shrink-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ENTRY_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group rounded-[32px] border border-gray-300 bg-white p-8 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04),0_8px_15px_-6px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${card.iconBg} ${card.hoverBg}`}>
                <span className={`transition-colors group-hover:text-white ${card.iconText}`}>{card.icon}</span>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">{card.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{card.description}</p>
            </Link>
          ))}
        </section>

        <section className="mt-2 flex shrink-0 flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
          <div className="flex space-x-4">
            <Link
              href="/app/annotate/mode"
              className={buttonStyle}
            >
              开始标注
            </Link>
            <Link
              href="/app/battle"
              className={buttonStyle}
            >
              开始对战
            </Link>
          </div>
          <Link
            href="/app/profile"
            className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-400 transition-colors hover:text-blue-600"
          >
            <span>打开个人中心</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </section>
      </main>

      <footer className="shrink-0 px-12 py-4 text-center text-[10px] tracking-wide text-gray-400">
        &copy; 2024 <span className="font-semibold text-gray-500">GeoAnnotate Platform</span>. All rights reserved.
      </footer>
    </div>
  );
}