"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";

export default function WikiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="wiki-sidebar w-64 shrink-0 border-r border-[#e1e4e8] bg-white hidden lg:block">
      <nav className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-4 pr-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#7d8590] mb-3 px-2">
          文档
        </div>
        <ul className="space-y-0.5 text-sm">
          {WIKI_NAV.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <>
                  <Link
                    href={item.href}
                    className={`block px-2 py-1.5 rounded-md ${
                      pathname === item.href
                        ? "bg-[#eef1f5] text-[#0969da] font-medium"
                        : "text-[#424a53] hover:bg-[#f0f2f5] hover:text-[#0969da]"
                    }`}
                  >
                    {item.title}
                  </Link>
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[#e1e4e8] pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`block py-1 rounded-md ${
                            pathname === child.href
                              ? "text-[#0969da] font-medium"
                              : "text-[#656d76] hover:text-[#0969da]"
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
                  className={`block px-2 py-1.5 rounded-md ${
                    pathname === item.href
                      ? "bg-[#eef1f5] text-[#0969da] font-medium"
                      : "text-[#424a53] hover:bg-[#f0f2f5] hover:text-[#0969da]"
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
