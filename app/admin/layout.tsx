"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";
import { ADMIN_NAV_ITEMS } from "@/features/admin/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/app/home");
    }
  }, [router, user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore and still clear local state
    }
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-background flex flex-col py-6 px-3 gap-1 flex-shrink-0">
        <div className="px-3 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            GeoAnnotate
          </p>
          <p className="font-semibold mt-0.5">管理后台</p>
        </div>

        {ADMIN_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
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
