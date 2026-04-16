"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Crosshair,
  Gift,
  History,
  LogOut,
  Menu,
  Swords,
  Trophy,
  UserCircle2,
  X,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app/annotate/mode", label: "\u6807\u6ce8", icon: Crosshair },
  { href: "/app/battle", label: "\u5bf9\u6218", icon: Swords },
  { href: "/app/rewards", label: "\u5956\u52b1", icon: Gift },
  { href: "/app/leaderboard", label: "\u6392\u884c", icon: Trophy },
  { href: "/app/history", label: "\u5386\u53f2", icon: History },
  { href: "/wiki", label: "\u77e5\u8bc6\u5e93", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Keep local logout behavior even if remote signout fails.
    } finally {
      logout();
      router.push("/auth/login");
    }
  };

  const username = user?.username ?? "\u7528\u6237";
  const level = user?.level ?? 1;
  const points = user?.points_balance ?? 0;
  const initials = username.trim().slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[#2f4b39] bg-[rgba(6,13,8,0.92)] backdrop-blur-md">
      <div className="mx-auto flex h-[78px] w-full max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/app/home" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#3a6248] bg-[rgba(30,64,41,0.6)]">
              <Image
                src="/images/home/logo.png"
                alt="GeoAnnotate 标志"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8d6c2]">
                {"\u5730\u7406\u5e73\u53f0"}
              </p>
              <p className="font-semibold tracking-tight text-[#f2fff5]">
                GeoAnnotate
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={
                  pathname === item.href ||
                  (item.href !== "/wiki" && pathname.startsWith(item.href))
                }
              />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-md border border-[#31503d] bg-[rgba(20,39,27,0.85)] px-3 py-1.5 text-xs text-[#d9efe0]">
              {"\u7b49\u7ea7"} {level}
            </span>
            <span className="rounded-md border border-[#31503d] bg-[rgba(20,39,27,0.85)] px-3 py-1.5 text-xs text-[#d9efe0]">
              {points} {"\u5206"}
            </span>
          </div>

          <Link
            href="/app/profile"
            className="inline-flex items-center gap-2 rounded-md border border-[#395b46] bg-[rgba(25,46,32,0.88)] px-2.5 py-2 text-[#ebf9ef] transition hover:border-[#4a775c] hover:bg-[rgba(35,61,42,0.88)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgba(49,91,62,0.85)] text-xs font-bold">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-xs font-semibold">
                {username}
              </p>
              <p className="text-[10px] text-[#b6d1bf]">{"\u4e2a\u4eba\u4e2d\u5fc3"}</p>
            </div>
            <UserCircle2 className="hidden h-4 w-4 text-[#b6d1bf] sm:block" />
          </Link>

          <button
            onClick={handleLogout}
            className="hidden h-10 items-center gap-2 rounded-md border border-[#5c3a3a] bg-[rgba(58,22,22,0.7)] px-3 text-sm font-medium text-[#ffd9d9] transition hover:bg-[rgba(82,31,31,0.76)] md:inline-flex"
          >
            <LogOut className="h-4 w-4" />
            {"\u9000\u51fa"}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((state) => !state)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#355741] bg-[rgba(21,39,28,0.84)] text-[#d8ecdf] transition hover:bg-[rgba(31,55,40,0.88)] xl:hidden"
            aria-label="\u6253\u5f00\u83dc\u5355"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#2a4433] bg-[rgba(8,18,12,0.96)] xl:hidden">
          <nav className="mx-auto flex w-full max-w-[1700px] flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={`mobile-${item.href}`}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={
                  pathname === item.href ||
                  (item.href !== "/wiki" && pathname.startsWith(item.href))
                }
              />
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#664545] bg-[rgba(70,29,29,0.75)] px-3 text-sm font-medium text-[#ffe3e3]"
            >
              <LogOut className="h-4 w-4" />
              {"\u9000\u51fa"}
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition",
        active
          ? "border-[#5d8a6f] bg-[rgba(41,78,53,0.86)] text-[#f2fff6]"
          : "border-transparent text-[#c3d8c9] hover:border-[#40634d] hover:bg-[rgba(27,49,35,0.82)] hover:text-white",
      ].join(" ")}
    >
      <Icon className={active ? "h-4 w-4 text-[#e6ffe8]" : "h-4 w-4"} />
      <span>{label}</span>
    </Link>
  );
}
