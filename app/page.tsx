import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#f0f7ff] text-[#1f2328]">
      
      {/* 1. 顶部导航栏 */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#d0d7de]/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5">
          {/* 左侧：Logo 和 App 名字 */}
          <Link href="/" className="flex items-center gap-3">
            {/* 这里的 div 现在包裹了你的 logo.png */}
            <div 
              className="h-9 w-9 rounded-xl shadow-sm border border-[#d0d7de]/30"
              style={{
                backgroundImage: `url('/images/home/logo.png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="text-xl font-bold tracking-tight text-[#1f2328]">
              Geo<span className="text-[#0969da]">Annotate</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg border border-[#d0d7de] bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-[#0969da] hover:bg-[#f0f7ff] active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              登录
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-[#0969da] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#085bc4] active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              注册
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. 主体区域 */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-start px-10 pt-12 pb-20">
        
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row lg:items-start">
          
          {/* 左侧文字部分 */}
          <div className="z-10 flex-1 py-12 text-left">
            <header>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#0969da] opacity-80">
                Next-Gen Geographic Intelligence
              </p>
              <h1 className="mb-8 text-6xl font-black tracking-tight leading-[1.1] md:text-7xl">
                为地理大模型 <br />
                注入 <span className="text-[#0969da]">人类认知。</span>
              </h1>
              <p className="mb-10 max-w-lg text-xl leading-relaxed text-[#57606a]">
                GeoAnnotate 是一个专业的地理推理标注与 AI 对战平台。我们通过游戏化竞技与高质量思维链标注，构建更懂真实世界的地理多模态智能。
              </p>
            </header>

            {/* 入口按钮 */}
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/app/home"
                className="group flex items-center gap-3 rounded-xl bg-[#0969da] px-10 py-5 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 hover:bg-[#085bc4] active:scale-95"
              >
                进入平台 <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/wiki"
                className="flex items-center gap-3 rounded-xl border-2 border-[#d0d7de] bg-white/40 px-10 py-5 text-lg font-bold backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[#0969da] active:scale-95"
              >
                浏览 Wiki <BookOpen className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* 右侧图片部分 */}
          <div className="relative flex-[1.2] w-full min-h-[600px] lg:mt-10">
            <div 
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url('/images/home/background.png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'right top',
                backgroundRepeat: 'no-repeat',
                maskImage: 'linear-gradient(to left, black 75%, transparent 100%), linear-gradient(to top, transparent 5%, black 25%)',
                WebkitMaskImage: 'linear-gradient(to left, black 75%, transparent 100%), linear-gradient(to top, transparent 5%, black 25%)',
                maskComposite: 'intersect',
                WebkitMaskComposite: 'source-in'
              }}
            />
          </div>

        </div>
      </main>

      {/* 3. 页脚 */}
      <footer className="border-t border-[#d0d7de]/30 bg-white/20 py-10 text-center backdrop-blur-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8c959f]">
          © 2026 GeoAnnotate Platform · Research Infrastructure
        </p>
      </footer>
    </div>
  );
}