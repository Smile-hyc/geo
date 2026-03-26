import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CORE_APP_ROUTES } from "@/features/platform/routes";

export default function RootPage() {
  const primaryButtonStyle = "rounded-2xl border-2 border-transparent bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-md transition-all hover:-translate-y-1 hover:bg-blue-700 active:scale-95 inline-flex items-center gap-2";
  const secondaryButtonStyle = "rounded-2xl border-2 border-gray-300 bg-white px-8 py-3 text-base font-bold text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600 hover:text-blue-600 active:scale-95";

  return (
    <div className="h-screen w-full bg-[linear-gradient(180deg,#eff6ff,#f7fafc_38%,#edf4fb_100%)] text-foreground overflow-hidden flex flex-col">
      
      {/* py-8 稍微缩小，为顶部留白匀出空间 */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 flex flex-col px-6 md:px-16 lg:px-20 py-8">
        
        {/* Hero Section - 保持 mt-12 的顶部留白 */}
        <section className="mb-10 mt-12 shrink-0">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
            GeoAnnotate 平台
          </p>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            把公开文档与地理标注应用<span className="text-blue-600 ml-3">明确分区。</span>
          </h1>
          <p className="max-w-4xl text-base leading-relaxed text-slate-500 md:text-lg">
            首页按照需求完成拆分：公开 Wiki 位于 
            <code className="mx-1.5 rounded bg-blue-100/50 px-1.5 py-0.5 text-blue-800 font-mono text-sm">/wiki</code>
            ，任务驱动应用位于 
            <code className="mx-1.5 rounded bg-blue-100/50 px-1.5 py-0.5 text-blue-800 font-mono text-sm">/app</code>。
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/app/home" className={primaryButtonStyle}>
              进入平台 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/wiki" className={secondaryButtonStyle}>
              浏览 Wiki
            </Link>
          </div>
        </section>

        {/* Grid Section - 缩小间距以防止触底 */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 min-h-0 pb-2">
          
          {/* 左侧卡片 - 适当缩小内边距 p-8 (原为 p-10) */}
          <div className="group relative flex flex-col rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm lg:col-span-7">
            <div className="mb-6 flex items-center gap-4 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">核心应用</h2>
                <p className="text-xs text-slate-500 font-medium">任务驱动的功能模块</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {CORE_APP_ROUTES.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  /* p-6 保持字号的同时缩小容器内边距 */
                  className="group/item flex flex-col justify-center rounded-2xl border-2 border-slate-300 bg-slate-50/40 p-6 transition-all hover:border-blue-500 hover:bg-white hover:shadow-md"
                >
                  <p className="text-xl font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors">
                    {route.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {route.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 右侧卡片组 - 缩减间距 */}
          <div className="flex flex-col gap-5 lg:col-span-5 min-h-0">
            {/* Wiki 卡片 - 缩减 p-10 (原为 p-12) */}
            <div className="group relative flex flex-col justify-center rounded-[32px] border border-slate-200 bg-white/80 p-10 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">公开 Wiki</h3>
              <p className="mb-6 text-base leading-relaxed text-slate-500">
                面向入门指南、数据集下载、学术工具和实验笔记的公开文档区。
              </p>
              <Button asChild variant="outline" size="lg" className="w-fit rounded-xl border-2 font-bold hover:bg-sky-50 px-6 py-5 text-sm">
                <Link href="/wiki">浏览知识库</Link>
              </Button>
            </div>

            {/* MVP 状态卡片 - 缩减 p-8 (原为 p-10) */}
            <div className="group relative rounded-[32px] bg-slate-900 p-8 text-white shadow-xl flex flex-col justify-center overflow-hidden">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Swords className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-lg font-bold">MVP 路由分区</h3>
              <p className="mb-4 text-sm text-slate-400">
                已实现系统级的 <span className="text-white">/app</span> 与 <span className="text-white">/auth</span> 硬分区。
              </p>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-blue-400 transition-colors">
                  <ShieldCheck className="h-4 w-4" />
                  管理后台
                </Link>
                <span className="text-[10px] font-mono text-slate-500 opacity-60">v1.0.0</span>
              </div>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="mt-auto shrink-0 flex justify-between items-center text-slate-400 pb-2">
          <p className="text-[10px]">© 2026 <span className="font-bold text-slate-500">GeoAnnotate Platform</span></p>
          <div className="h-px flex-1 mx-6 bg-slate-200/50"></div>
          <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-300">Root Directory</p>
        </footer>
      </main>
    </div>
  );
}