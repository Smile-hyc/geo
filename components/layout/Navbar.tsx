"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore sign-out transport errors and still clear local state
    } finally {
      logout();
      router.push("/auth/login");
    }
  };

  const username = user?.username ?? "Smile";
  const initials = username.trim().slice(0, 2).toUpperCase();

  return (
    <nav className="shrink-0 border-b border-gray-200/80">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-6 md:px-12">
        <div className="flex min-w-0 items-center gap-8 lg:gap-10">
          <Link
            href="/app/home"
            className="flex items-center gap-2 whitespace-nowrap text-xl font-bold text-blue-600"
          >
            <MapPin className="h-7 w-7" />
            <span className="tracking-tight text-2xl text-[#1e40af]">GeoAnnotate</span>
          </Link>

          <div className="hidden min-w-0 items-center gap-8 text-sm font-medium text-gray-500 lg:flex">
            <NavLink href="/app/annotate/mode" icon="📍" label="标注" />
            <NavLink href="/app/battle" icon="⚔️" label="对战" />
            <NavLink href="/app/rewards" icon="🎁" label="奖励" />
            <NavLink href="/app/leaderboard" icon="🏆" label="排行榜" />
            <NavLink href="/app/history" icon="🕒" label="历史" />
            <NavLink href="/wiki" icon="📖" label="文档" />
            {user?.role === "admin" ? <NavLink href="/admin" icon="🛠️" label="管理" /> : null}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="hidden items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 font-bold text-orange-400 sm:flex">
            <span>🪙</span>
            <span>{user?.points_balance ?? 0} 积分</span>
          </div>

          <Link href="/app/profile">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100 text-xs font-bold text-blue-600 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04),0_8px_15px_-6px_rgba(0,0,0,0.04)]">
                {initials}
              </div>
              <span className="font-semibold">{username}</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-1.5 whitespace-nowrap transition hover:text-blue-600">
      <span className="text-lg leading-none">{icon}</span>
      <span className="transition-transform group-hover:translate-x-0.5">{label}</span>
    </Link>
  );
}
