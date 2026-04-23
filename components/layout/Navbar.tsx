"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Home,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app/home", label: "首页", icon: Home },
  { href: "/app/annotate/mode", label: "标注", icon: Crosshair },
  { href: "/app/battle", label: "对战", icon: Swords },
  { href: "/app/rewards", label: "奖励", icon: Gift },
  { href: "/app/leaderboard", label: "排行", icon: Trophy },
  { href: "/app/history", label: "历史", icon: History },
  { href: "/wiki", label: "库", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      logout();
      router.push("/auth/login");
    }
  };

  const username = user?.username ?? "用户";
  const points = user?.points_balance ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300",
          "bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg",
          scrolled ? "scale-95 shadow-xl" : "scale-100"
        )}
      >
        <Link href="/app/home" className="flex items-center gap-2 px-3 py-1 mr-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary/10 p-1">
            <Image
              src="/images/home/logo.png"
              alt="Logo"
              fill
              className="object-contain p-1"
            />
          </div>
          <span className="hidden font-bold tracking-tight text-slate-800 lg:block">
            识图寻境
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
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
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

        <div className="flex items-center gap-2">
          <div className="hidden items-center px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold md:flex">
            {points} pts
          </div>

          <Link
            href="/app/profile"
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <div className="hidden text-right lg:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Profile</p>
              <p className="text-xs font-semibold text-slate-700 leading-tight">{username}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
              {username.slice(0, 1).toUpperCase()}
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden p-2 rounded-full hover:bg-slate-100"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={handleLogout}
            className="hidden p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all md:flex"
            title="退出登录"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl p-4 md:hidden"
          >
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-white shadow-lg"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold"
            >
              <LogOut size={20} />
              退出登录
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
        active
          ? "text-primary bg-primary/10 shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
      )}
    >
      <Icon size={16} className={cn(active ? "text-primary" : "text-slate-400")} />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full border border-primary/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}
