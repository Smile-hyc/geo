"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WIKI_NAV } from "@/lib/wiki-nav";

export default function WikiMobileNav() {
  const pathname = usePathname();

  return (
    <details className="group">
      <summary className="cursor-pointer list-none py-1 text-sm font-medium text-[#d8eadf]">
        <span className="inline-flex items-center gap-1">
          Sections
          <svg
            className="h-4 w-4 transition group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </summary>

      <ul className="mt-2 space-y-0.5 border-l-2 border-[#32513f] pl-2 text-sm">
        {WIKI_NAV.flatMap((item) =>
          item.children
            ? [
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      pathname === item.href
                        ? "font-medium text-[#f3fff6]"
                        : "text-[#bed5c5]"
                    }
                  >
                    {item.title}
                  </Link>
                </li>,
                ...item.children.map((child) => (
                  <li key={child.href} className="pl-2">
                    <Link
                      href={child.href}
                      className={
                        pathname === child.href
                          ? "font-medium text-[#f3fff6]"
                          : "text-[#9eb7a7]"
                      }
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
                    className={
                      pathname === item.href
                        ? "font-medium text-[#f3fff6]"
                        : "text-[#bed5c5]"
                    }
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
