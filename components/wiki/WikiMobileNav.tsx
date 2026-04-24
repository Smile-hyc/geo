"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function WikiMobileNav() {
  const pathname = usePathname();

  return (
    <details className="group mb-4">
      <summary className="cursor-pointer list-none py-3 px-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between text-sm font-bold text-slate-700">
        <span>目录导航</span>
        <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-2 p-2 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-100">
        <ul className="space-y-1">
          {WIKI_NAV.flatMap((item) =>
            item.children
              ? [
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-3 py-2 rounded-xl text-sm transition-all",
                        pathname === item.href
                          ? "bg-primary text-white font-bold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>,
                  ...item.children.map((child) => (
                    <li key={child.href} className="pl-4">
                      <Link
                        href={child.href}
                        className={cn(
                          "block px-3 py-1.5 rounded-lg text-xs transition-colors",
                          pathname === child.href
                            ? "text-primary font-bold"
                            : "text-slate-500 hover:text-slate-900"
                        )}
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
                      className={cn(
                        "block px-3 py-2 rounded-xl text-sm transition-all",
                        pathname === item.href
                          ? "bg-primary text-white font-bold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>,
                ]
          )}
        </ul>
      </div>
    </details>
  );
}
