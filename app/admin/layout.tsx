"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  ClipboardCheck,
  Cpu,
  Download,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  ListTodo,
  LogOut,
  type LucideIcon,
  Users,
  Settings,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";
import { ADMIN_NAV_ITEMS } from "@/features/admin/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICON_BY_PATH: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/images": ImageIcon,
  "/admin/tasks": ListTodo,
  "/admin/reviews": ClipboardCheck,
  "/admin/rewards": Gift,
  "/admin/ai-models": Cpu,
  "/admin/analytics": BarChart2,
  "/admin/export": Download,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/app/home");
    }
  }, [loading, router, user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
    }
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex">
      <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col sticky top-0 h-screen">
        <div className="px-8 py-10">
          <Link href="/app/home" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition-transform group-hover:rotate-12">
              <span className="text-sm font-black">GA</span>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Control Panel</p>
               <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">GeoAdmin</h1>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon =
              (item as { icon?: LucideIcon }).icon ||
              ICON_BY_PATH[item.href] ||
              LayoutDashboard;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 items-center gap-3 px-4 rounded-2xl text-sm font-bold transition-all",
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start h-12 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold"
          >
            <LogOut size={18} className="mr-3" />
            退出管理台
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-7xl p-6 md:p-10 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
