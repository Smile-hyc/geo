"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";

/** 小屏幕下显示的 Wiki 目录下拉/列表，便于移动端导航 */
export default function WikiMobileNav() {
  const pathname = usePathname();

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-medium text-[#424a53] py-1">
        <span className="inline-flex items-center gap-1">
          目录
          <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <ul className="mt-2 space-y-0.5 text-sm pl-2 border-l-2 border-[#e1e4e8]">
        {WIKI_NAV.flatMap((item) =>
          item.children
            ? [
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={pathname === item.href ? "text-[#0969da] font-medium" : "text-[#656d76]"}
                  >
                    {item.title}
                  </Link>
                </li>,
                ...item.children.map((child) => (
                  <li key={child.href} className="pl-2">
                    <Link
                      href={child.href}
                      className={pathname === child.href ? "text-[#0969da] font-medium" : "text-[#656d76]"}
                    >
                      {child.title}
                    </Link>
                  </li>
                )),
              ]
            : [
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={pathname === item.href ? "text-[#0969da] font-medium" : "text-[#656d76]"}
                  >
                    {item.title}
                  </Link>
                </li>,
              ]
        )}
      </ul>
    </details>
  );
}
