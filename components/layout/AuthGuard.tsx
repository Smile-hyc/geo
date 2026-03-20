"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { getLoginState, syncUserToDb, getUserProfile } from "@/lib/cloudbase";

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
          router.replace("/auth/login");
          return;
        }
        const uid = loginState.user.uid ?? "unknown";
        const email = (loginState.user as { email?: string }).email ?? "";
        const fallbackUsername = email ? email.split("@")[0] : uid.substring(0, 8);

        try {
          const dbUser = await syncUserToDb({
            username: fallbackUsername,
            email: email || uid,
            cloudbase_uid: uid,
          });
          setUser({
            uid,
            email: email || uid,
            username: dbUser.username || fallbackUsername,
            role: dbUser.role || "user",
            points_balance: dbUser.points_balance ?? 0,
            level: dbUser.level ?? 1,
          });
        } catch {
          const profileRes = await getUserProfile({ cloudbase_uid: uid, email: email || undefined });
          if (profileRes?.user) {
            setUser({
              uid,
              email: profileRes.user.email || email,
              username: profileRes.user.username || fallbackUsername,
              role: profileRes.user.role || "user",
              points_balance: profileRes.user.points_balance ?? 0,
              level: profileRes.user.level ?? 1,
            });
          } else {
            setUser({
              uid,
              email: email || uid,
              username: fallbackUsername,
              role: "user",
              points_balance: 0,
              level: 1,
            });
          }
        }
      } catch {
        router.replace("/auth/login");
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
