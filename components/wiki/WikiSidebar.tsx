"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";

export default function WikiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[#2c4637] bg-[rgba(7,15,10,0.95)] lg:block">
      <nav className="sticky top-0 h-screen overflow-y-auto px-4 py-4">
        <div className="wg-panel mb-4 p-3 text-sm">
          <p className="font-medium text-[#ecfff0]">GeoAnnotate 知识库</p>
          <p className="mt-1 text-xs text-[#bdd5c5]">
            工具、环境、数据集与实验的结构化笔记。
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="rounded-md border border-[#335642] px-2 py-1 text-xs text-[#c7dfcf] hover:bg-[rgba(30,53,39,0.8)]"
            >
              落地页
            </Link>
            <Link
              href="/app/home"
              className="rounded-md border border-[#487257] bg-[rgba(36,87,52,0.82)] px-2 py-1 text-xs text-white"
            >
              应用首页
            </Link>
          </div>
        </div>

        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[#a8c3b0]">
          导航
        </div>

        <ul className="space-y-1 text-sm">
          {WIKI_NAV.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-2 py-1.5 ${
                      pathname === item.href
                        ? "bg-[rgba(46,84,59,0.85)] text-[#f2fff5]"
                        : "text-[#c8dece] hover:bg-[rgba(24,44,32,0.82)] hover:text-white"
                    }`}
                  >
                    {item.title}
                  </Link>
                  <ul className="ml-2 mt-1 space-y-1 border-l border-[#2f4f3c] pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`block rounded-md py-1 ${
                            pathname === child.href
                              ? "text-[#f2fff5]"
                              : "text-[#acc5b6] hover:text-white"
                          }`}
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block rounded-md px-2 py-1.5 ${
                    pathname === item.href
                      ? "bg-[rgba(46,84,59,0.85)] text-[#f2fff5]"
                      : "text-[#c8dece] hover:bg-[rgba(24,44,32,0.82)] hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
