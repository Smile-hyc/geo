"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";

export default function WikiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="wiki-sidebar w-64 shrink-0 border-r border-[#e1e4e8] bg-white hidden lg:block">
      <nav className="sticky top-0 h-screen overflow-y-auto py-4 pl-4 pr-2">
        <div className="mb-4 rounded-xl border border-[#e1e4e8] bg-[#f6f8fa] p-3 text-sm">
          <p className="font-medium text-[#1f2328]">GeoAnnotate Docs</p>
          <p className="mt-1 text-xs text-[#656d76]">
            Documentation is public. The platform lives under /app.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="rounded-md border border-[#d0d7de] px-2 py-1 text-xs text-[#57606a] hover:bg-white"
            >
              Landing
            </Link>
            <Link
              href="/app/home"
              className="rounded-md bg-[#0969da] px-2 py-1 text-xs text-white"
            >
              Platform
            </Link>
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wider text-[#7d8590] mb-3 px-2">
          Docs
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
