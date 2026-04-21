import Link from "next/link";
import WikiSidebar from "@/components/wiki/WikiSidebar";
import WikiMobileNav from "@/components/wiki/WikiMobileNav";
import { Button } from "@/components/ui/button";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <WikiSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-slate-100 px-6 py-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                GeoAnnotate 知识库
              </p>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                文档、流程与实验参考
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="rounded-full px-4">落地页</Button>
              </Link>
              <Link href="/app/home">
                <Button size="sm" className="rounded-full px-4">应用首页</Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-100 px-6 py-4 lg:hidden">
          <WikiMobileNav />
        </div>

        <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-12">
          <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 lg:p-16">
            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-a:font-bold prose-img:rounded-3xl prose-pre:rounded-3xl">
              {children}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
