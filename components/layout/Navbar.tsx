"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Trophy, Clock, User, LogOut, Coins, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { signOut } from "@/lib/cloudbase";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2 font-semibold text-primary">
            <MapPin className="h-5 w-5" />
            <span>GeoAnnotate</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/annotate" icon={<MapPin className="h-4 w-4" />} label="标注" />
            <NavLink href="/battle" icon={<Trophy className="h-4 w-4" />} label="对战" />
            <NavLink href="/rewards" icon={<Gift className="h-4 w-4" />} label="兑换" />
            <NavLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} label="排行" />
            <NavLink href="/history" icon={<Clock className="h-4 w-4" />} label="历史" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{user.points_balance}</span>
              <span className="text-muted-foreground hidden sm:inline">积分</span>
            </div>
          )}
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.username ?? "我的"}</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出</span>
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
