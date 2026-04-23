"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function WikiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-100 bg-white/50 lg:block">
      <nav className="sticky top-0 h-screen overflow-y-auto px-6 py-10">
        <Card className="mb-8 border-none shadow-sm bg-sky-50/50 overflow-hidden">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 text-sm">识图寻境知识库</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              产品定位、技术架构、场景方案与数据评测的结构化文档。
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/"
                className="text-[10px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-700 transition-colors"
              >
                落地页
              </Link>
              <div className="w-1 h-1 rounded-full bg-slate-300 self-center" />
              <Link
                href="/app/home"
                className="text-[10px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-700 transition-colors"
              >
                应用首页
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          导航目录
        </div>

        <ul className="space-y-1">
          {WIKI_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  pathname === item.href
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {item.title}
              </Link>
              {item.children && (
                <ul className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-4 py-1">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={cn(
                          "block rounded-lg py-1.5 text-xs transition-colors",
                          pathname === child.href
                            ? "font-bold text-primary"
                            : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
