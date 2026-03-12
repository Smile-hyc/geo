"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Image as ImageIcon, ClipboardList, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";

const NAV_ITEMS = [
  { href: "/admin", label: "仪表盘", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/images", label: "图片管理", icon: <ImageIcon className="h-4 w-4" /> },
  { href: "/admin/reviews", label: "标注审核", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/admin/tasks", label: "任务配置", icon: <Settings className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/home");
    }
  }, [user, router]);

  const handleLogout = async () => {
    try { await signOut(); } catch { }
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border bg-background flex flex-col py-6 px-3 gap-1 flex-shrink-0">
        <div className="px-3 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">GeoAnnotate</p>
          <p className="font-semibold mt-0.5">管理后台</p>
        </div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
