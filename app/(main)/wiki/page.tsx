"use client";

import Link from "next/link";
import { 
  BookOpen, 
  MapPin, 
  Rocket, 
  Target, 
  GitBranch, 
  FlaskConical, 
  DatabaseZap, 
  Wrench, 
  ArrowRight,
  LibraryBig
} from "lucide-react";

// 统一样式规范 - 复用项目标准
const secondaryButtonStyle = "rounded-2xl border-2 border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600 hover:text-blue-600 active:scale-95 inline-flex items-center gap-2";

export default function WikiPage() {
  return (
    <div className="flex-1 min-h-full bg-[linear-gradient(180deg,#f8fafc,#eff6ff_100%)] flex flex-col text-slate-900">
      
      {/* 顶部 Header */}
      <header className="w-full shrink-0 flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <LibraryBig className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            GeoAnnotate Wiki
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/app/home" className={secondaryButtonStyle}>
            <MapPin className="h-3.5 w-3.5" /> 进入工作台
          </Link>
          <Link href="/" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest hidden sm:inline-flex">
            返回首页
          </Link>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 w-full overflow-y-auto px-8 py-10 pb-24">
        
        {/* 欢迎区域 */}
        <section className="mb-10 text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 opacity-80">
            LAB KNOWLEDGE BASE
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            探索地理智能，<span className="text-blue-600">科研从这里起步。</span>
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 font-medium">
            本 Wiki 整合了实验室的核心科研资源。请按照下方的指南配置环境，或查询最新的实验数据集与规范。
          </p>
        </section>

        {/* 磁贴卡片区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* 磁贴一：科研入门 */}
          <div className="group rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase">入门指南</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-[9px] font-bold text-blue-600 uppercase">Guide</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LinkItem href="/wiki/getting-started/lab-intro" icon={BookOpen} title="实验室介绍" desc="了解研究方向与愿景" />
              <LinkItem href="/wiki/getting-started/reading-list" icon={DatabaseZap} title="论文阅读路径" desc="文献与方法论指引" />
              <LinkItem href="/wiki/getting-started/environment-setup" icon={Target} title="环境配置指引" desc="开发依赖与资源申请" />
              <LinkItem href="/wiki/getting-started/research-workflow" icon={GitBranch} title="科研迭代流程" desc="从选题到投稿全周期" />
            </div>
          </div>

          {/* 磁贴二：实验资源 */}
          <div className="group rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-500 hover:shadow-md flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <DatabaseZap className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase">实验资源</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">Resources</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LinkItem href="/wiki/datasets" icon={DatabaseZap} title="数据集说明" desc="标注数据及公开集获取" />
              <LinkItem href="/wiki/tools" icon={Wrench} title="学术工具推荐" desc="实验、评测与写作工具" />
              <LinkItem href="/wiki/experiments" icon={FlaskConical} title="实验记录规范" desc="科研复现性操作指南" />
              <LinkItem href="/wiki/glossary" icon={BookOpen} title="专业术语表" desc="地理信息核心术语" />
            </div>
          </div>
        </div>

        {/* 底部 FAQ - 已修改为浅色样式 */}
        <section className="mt-10 group rounded-[32px] border border-slate-200 bg-white/50 backdrop-blur-sm p-8 text-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-blue-500">
          <div className="text-left">
            <h3 className="text-xl font-bold tracking-tight">遇到疑问？</h3>
            <p className="mt-2 text-xs text-slate-500 font-medium">
              我们汇总了新人最常遇到的环境、服务器访问及平台功能问题。
            </p>
          </div>
          <Link href="/wiki/faq" className="rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 inline-flex items-center gap-2 shrink-0">
            查看 FAQ <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        {/* 简易 Footer */}
        <footer className="mt-16 py-6 border-t border-slate-100 flex justify-between items-center text-slate-400">
          <p className="text-[9px] font-bold">© 2026 GEOANNOTATE PLATFORM</p>
          <p className="text-[9px] tracking-widest uppercase font-black text-slate-300">Lab Research Directory</p>
        </footer>
      </main>
    </div>
  );
}

function LinkItem({ 
  href, 
  icon: Icon, 
  title, 
  desc 
}: { 
  href: string; 
  icon: React.ElementType; 
  title: string; 
  desc: string; 
}) {
  return (
    <Link 
      href={href} 
      className="group/item flex flex-col rounded-2xl border-2 border-slate-200 bg-slate-50/30 p-5 transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-md hover:-translate-y-1"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 transition-all group-hover/item:bg-blue-600 group-hover/item:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-base font-bold text-slate-800 tracking-tight leading-tight mb-1 group-hover/item:text-blue-600 transition-colors">{title}</p>
      <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{desc}</p>
    </Link>
  );
}