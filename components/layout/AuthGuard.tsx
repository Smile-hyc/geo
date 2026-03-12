"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { getLoginState } from "@/lib/cloudbase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        setLoading(false);
        return;
      }
      try {
        const loginState = await getLoginState();
        if (!loginState) {
          router.replace("/login");
          return;
        }
        const uid = loginState.user.uid ?? "unknown";
        setUser({
          uid,
          email: "",
          username: uid.substring(0, 8),
          role: "user",
          points_balance: 0,
          level: 1,
        });
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [user, setUser, setLoading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">加载中…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
