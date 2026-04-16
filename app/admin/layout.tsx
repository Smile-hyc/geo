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
} from "lucide-react";

import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";
import { ADMIN_NAV_ITEMS } from "@/features/admin/navigation";

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
      // allow local logout fallback
    }
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="wg-shell">
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-[#2b4635] bg-[rgba(8,17,11,0.95)] lg:flex lg:flex-col">
          <div className="border-b border-[#2b4635] px-6 py-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#b6d3c0]">
              GeoAnnotate
            </p>
            <h1 className="mt-2 text-xl font-semibold text-[#ecfff0]">
              Admin Console
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
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
                  className={[
                    "mb-1 flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition",
                    active
                      ? "border-[#5b8a6f] bg-[rgba(36,74,49,0.88)] text-[#effff2]"
                      : "border-transparent text-[#c4dacb] hover:border-[#3f634d] hover:bg-[rgba(25,46,33,0.85)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#2b4635] p-3">
            <button
              onClick={handleLogout}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#664545] bg-[rgba(70,29,29,0.72)] text-sm text-[#ffe4e4]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-h-screen flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
