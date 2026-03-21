"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Coins,
  Gift,
  LogOut,
  MapPin,
  Trophy,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <nav className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href="/app/home"
            className="flex items-center gap-2 font-semibold text-primary whitespace-nowrap"
          >
            <MapPin className="h-5 w-5" />
            <span>GeoAnnotate</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 min-w-0">
            <NavLink
              href="/app/annotate/mode"
              icon={<MapPin className="h-4 w-4" />}
              label="标注"
            />
            <NavLink
              href="/app/battle"
              icon={<Trophy className="h-4 w-4" />}
              label="对战"
            />
            <NavLink
              href="/app/rewards"
              icon={<Gift className="h-4 w-4" />}
              label="奖励"
            />
            <NavLink
              href="/app/leaderboard"
              icon={<Trophy className="h-4 w-4" />}
              label="排行榜"
            />
            <NavLink
              href="/app/history"
              icon={<Clock className="h-4 w-4" />}
              label="历史"
            />
            <NavLink
              href="/wiki"
              icon={<BookOpen className="h-4 w-4" />}
              label="文档"
            />
            {user?.role === "admin" ? (
              <NavLink
                href="/admin"
                icon={<User className="h-4 w-4" />}
                label="管理"
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{user.points_balance}</span>
              <span className="text-muted-foreground">积分</span>
            </div>
          ) : null}

          <Link href="/app/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.username ?? "个人中心"}</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出登录</span>
          </Button>
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
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
    >
      {icon}
      {label}
    </Link>
  );
}
